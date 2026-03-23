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

const LOCALIZED_DATASETS = [
  "/fixed_rivers.json",
  "/world-marine.json",
  "/lakes.json",
] as const;

const translationLookupByLanguage = new Map<BaseLanguage, Promise<Map<string, string>>>();

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
    const value = properties.name_cs;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  if (language === "de") {
    const value = properties.name_de;
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

async function buildTranslationLookup(language: BaseLanguage): Promise<Map<string, string>> {
  if (language === "en") {
    return new Map();
  }

  const lookup = new Map<string, string>();
  const datasets = await Promise.all(
    LOCALIZED_DATASETS.map(async (url) => {
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

      const englishName = typeof properties.name === "string" ? properties.name.trim() : "";
      const localizedName = pickLocalizedName(properties, language);
      if (!englishName || !localizedName) {
        continue;
      }

      lookup.set(normalizeLookupKey(englishName), localizedName);
    }
  }

  return lookup;
}

async function getTranslationLookup(language: BaseLanguage): Promise<Map<string, string>> {
  let cached = translationLookupByLanguage.get(language);
  if (!cached) {
    cached = buildTranslationLookup(language);
    translationLookupByLanguage.set(language, cached);
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
): Promise<PhysicalFeature[]> {
  const baseLanguage = getBaseLanguage(language);
  if (baseLanguage === "en") {
    return features;
  }

  const lookup = await getTranslationLookup(baseLanguage);
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
