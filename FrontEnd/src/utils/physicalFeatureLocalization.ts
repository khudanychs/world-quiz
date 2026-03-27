import type { PhysicalFeature } from "./physicalFeatures";
import { toPhysicalFeatureDisplayName } from "./physicalFeatureNames";

type BaseLanguage = "en" | "cs" | "de";

interface FeatureLike {
  properties?: Record<string, unknown>;
}

interface FeatureCollectionLike {
  type?: string;
  features?: FeatureLike[];
}

interface TopologyLike {
  type?: string;
  objects?: Record<string, { geometries?: FeatureLike[] }>;
}

const LOCALIZED_DATASETS: Record<string, string> = {
  rivers: "/fixed_rivers.json",
  waters: "/FinalMarines10m.json",
  lakes: "/lakes.json",
};

const translationLookupByLanguageAndDataset = new Map<string, Promise<Map<string, string>>>();

function getBaseLanguage(language: string): BaseLanguage {
  const value = (language || "en").toLowerCase().split("-")[0];
  if (value === "cs" || value === "cz") return "cs";
  if (value === "de") return "de";
  return "en";
}

function normalizeLookupKey(name: string): string {
  return toPhysicalFeatureDisplayName(name).trim().toLowerCase();
}

function pickLocalizedName(properties: Record<string, unknown>, language: BaseLanguage): string | null {
  if (language === "cs") {
    const value = properties.name_cs ?? properties.NAME_CS ?? properties.name_cz ?? properties.NAME_CZ;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  if (language === "de") {
    const value = properties.name_de ?? properties.NAME_DE;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  return null;
}

function toPropertyItems(raw: unknown): FeatureLike[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  const featureCollection = raw as FeatureCollectionLike;
  if (featureCollection.type === "FeatureCollection" && Array.isArray(featureCollection.features)) {
    return featureCollection.features;
  }

  const topology = raw as TopologyLike;
  if (topology.type === "Topology" && topology.objects && typeof topology.objects === "object") {
    const firstObjectKey = Object.keys(topology.objects)[0];
    const firstObject = firstObjectKey ? topology.objects[firstObjectKey] : undefined;
    if (firstObject && Array.isArray(firstObject.geometries)) {
      return firstObject.geometries;
    }
  }

  return [];
}

async function buildTranslationLookup(
  language: BaseLanguage,
  datasetUrls: string[]
): Promise<Map<string, string>> {
  if (language === "en") {
    return new Map();
  }

  const lookup = new Map<string, string>();
  const datasets = await Promise.all(
    datasetUrls.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      return response.json() as Promise<unknown>;
    })
  );

  for (const dataset of datasets) {
    if (!dataset) {
      continue;
    }

    for (const item of toPropertyItems(dataset)) {
      const properties = item.properties;
      if (!properties) {
        continue;
      }

      const localizedName = pickLocalizedName(properties, language);
      if (!localizedName) {
        continue;
      }

      const englishCandidates = [
        properties.name,
        properties.name_en,
        properties.NAME,
        properties.NAME_EN,
        properties.moje_nazvy,
      ];

      for (const candidate of englishCandidates) {
        if (typeof candidate !== "string" || !candidate.trim()) {
          continue;
        }
        lookup.set(normalizeLookupKey(candidate), localizedName);
      }
    }
  }

  return lookup;
}

async function getTranslationLookup(
  language: BaseLanguage,
  datasetUrls: string[]
): Promise<Map<string, string>> {
  const cacheKey = `${language}-${datasetUrls.sort().join(",")}`;
  let cached = translationLookupByLanguageAndDataset.get(cacheKey);
  if (!cached) {
    cached = buildTranslationLookup(language, datasetUrls);
    translationLookupByLanguageAndDataset.set(cacheKey, cached);
  }
  return cached;
}

function applyTranslatedName(featureName: string, translatedBaseName: string): string {
  const suffixMatch = featureName.match(/\s\((\d+)\)$/);
  if (!suffixMatch) {
    return translatedBaseName;
  }
  return `${translatedBaseName} (${suffixMatch[1]})`;
}

export async function localizePhysicalFeatures(
  features: PhysicalFeature[],
  language: string,
  featureTypes?: Array<"rivers" | "waters" | "lakes">
): Promise<PhysicalFeature[]> {
  const baseLanguage = getBaseLanguage(language);
  if (baseLanguage === "en") {
    return features;
  }

  // Determine which datasets to load based on feature types
  const datasetUrls: string[] = [];
  if (featureTypes && featureTypes.length > 0) {
    for (const type of featureTypes) {
      const url = LOCALIZED_DATASETS[type];
      if (url) {
        datasetUrls.push(url);
      }
    }
  } else {
    // If no types specified, load all (backwards compatibility, but shouldn't happen)
    datasetUrls.push(...Object.values(LOCALIZED_DATASETS));
  }

  if (datasetUrls.length === 0) {
    return features;
  }

  const lookup = await getTranslationLookup(baseLanguage, datasetUrls);
  if (lookup.size === 0) {
    return features;
  }

  return features.map((feature) => {
    const localizedBaseName = lookup.get(normalizeLookupKey(feature.name));
    if (!localizedBaseName) {
      return feature;
    }

    return {
      ...feature,
      displayName: applyTranslatedName(feature.name, localizedBaseName),
    };
  });
}
