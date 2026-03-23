#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");
const dictionaryPath = path.join(__dirname, "dictionary.json");

const PHYSICAL_FILES = [
  "GeoLand.json",
  "rivers.json",
  "fixed_rivers.json",
  "lakes.json",
  "marine.json",
  "world-marine.json",
  "FinalMarines10m.json",
  "Land10mForMarines.json",
  path.join("region_polys", "deserts.json"),
  path.join("region_polys", "Mountain ranges.json"),
  path.join("region_polys", "elev_points.json"),
];

const SOURCE_FILES = [
  "countries-full.json",
  ...PHYSICAL_FILES,
];

const NAME_KEYS = [
  "name",
  "NAME",
  "NAME_EN",
  "name_en",
  "NAME_ALT",
  "name_alt",
  "NAMEALT",
  "LABEL",
  "moje_nazvy",
];

function normalizeTerm(value) {
  if (typeof value !== "string") return null;
  const term = value.replace(/\s+/g, " ").trim();
  return term.length > 0 ? term : null;
}

function canonicalizeTerm(value) {
  const normalized = normalizeTerm(value);
  if (!normalized) return null;
  return normalized
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’'‘`´]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DICTIONARY_ALIASES = {
  "Marshall Is.": "Marshall Islands",
  "N. Mariana Is.": "Northern Mariana Islands",
  "U.S. Virgin Is.": "United States Virgin Islands",
  "United States of America": "United States",
  "Br. Indian Ocean Ter.": "British Indian Ocean Territory",
  "Falkland Is.": "Falkland Islands",
  "Cayman Is.": "Cayman Islands",
  "British Virgin Is.": "British Virgin Islands",
  "Turks and Caicos Is.": "Turks and Caicos Islands",
  "S. Sudan": "South Sudan",
  "Solomon Is.": "Solomon Islands",
  "W. Sahara": "Western Sahara",
  "Wallis and Futuna Is.": "Wallis and Futuna",
  "Fr. Polynesia": "French Polynesia",
  "Fr. S. Antarctic Lands": "French Southern and Antarctic Lands",
  "Åland": "Åland Islands",
  "Eq. Guinea": "Equatorial Guinea",
  "Dominican Rep.": "Dominican Republic",
  "Faeroe Is.": "Faroe Islands",
  "Côte d'Ivoire": "Ivory Coast",
  "Dem. Rep. Congo": "DR Congo",
  "Central African Rep.": "Central African Republic",
  "Cabo Verde": "Cape Verde",
  "Bosnia and Herz.": "Bosnia and Herzegovina",
  "Heard I. and McDonald Is.": "Heard Island and McDonald Islands",
  "Antigua and Barb.": "Antigua and Barbuda",
  "Bahía de Campeche": "Bay of Campeche",
  "Gulf of Olen‘k": "Gulf of Olen'k",
  CAATINGAS: "Caatinga",
  "NAMIB DESERT": "Namib",
  "GARAGUM DESERT": "Karakum Desert",
  "QIZILQUM DESERT": "Kyzyl Kum",
  "DESIERTO DE ATACAMA": "Atacama Desert",
  "Idhän Murzuq": "Murzuq Desert",
  "Tassili-n-Ajjer": "Tassili n'Ajjer",
  "TAKLIMAKAN DESERT": "Taklamakan",
  "CAUCASUS MTS.": "Caucasus Mountains",
  "ALTAY MOUNTAINS": "Altai Mountains",
  "GREATER KHINGAN RANGE": "Greater Khingan",
  "CHAÎNE ANNAMITIQUE": "Annamite Range",
  PAMIRS: "Pamir mountains",
  APPENNINI: "Apennine Mountains",
  "Appennino Ligure": "Apennine Mountains",
  "COAST RANGES": "Coast Mountains",
  "KARAKORAM RA.": "Karakoram",
  "APPALACHIAN MTS.": "Appalachian Mountains",
  "ATLAS SAHARIEN": "Saharan Atlas",
  "HAUT ATLAS": "High Atlas",
  "TIBESTI MTS.": "Tibesti Mountains",
  "AHAGGAR MTS.": "Ahag",
  "AÏR MTS.": "Aïr Mountains",
  "Lesser Khingan Range": "Lesser Khingan",
  "EASTERN SAYAN MTS.": "Eastern Sayan Mountains",
  "YABLONOVYY RANGE": "Yablonoi Mountains",
  "HEJAZ MTS.": "Hejaz Mountains",
  "ASIR MTS.": "Asir Mountains",
  "ELBURZ MTS.": "Elburz Mountains",
  "SIERRA NEVADA (America)": "Sierra Nevada",
  "MACKENZIE MTS.": "Mackenzie Mountains",
  "Balkan Mts.": "Balkan Mountains",
  "Cord. Cantábrica": "Cantabrian Mountains",
  "S. Nevada (Iberia)": "Sierra Nevada",
  "Gora Elbrus": "Mount Elbrus",
  "Cerro Aconcagua": "Aconcagua",
  "Pik Imeni Ismail Samani": "Ismoil Somoni Peak",
  Chimborazo: "Chimborazo volcano",
  "Jebel Toubkal": "Jbel Toubkal",
  "Er Richat Depression": "Richat Structure",
};

const DICTIONARY_ALIASES_CANONICAL = new Map(
  Object.entries(DICTIONARY_ALIASES)
    .map(([alias, target]) => [canonicalizeTerm(alias), target])
    .filter(([key]) => Boolean(key)),
);

function buildDictionaryIndex(dictionary) {
  const index = new Map();
  for (const [rawKey, entry] of Object.entries(dictionary)) {
    const exact = normalizeTerm(rawKey);
    if (exact) {
      index.set(exact, { englishKey: exact, entry });
    }
    const canonical = canonicalizeTerm(rawKey);
    if (canonical && !index.has(canonical)) {
      index.set(canonical, { englishKey: exact || rawKey, entry });
    }
  }
  return index;
}

function resolveDictionaryMatch(dictionaryIndex, term) {
  const key = normalizeTerm(term);
  if (!key) return null;
  // Explicit aliases have priority so abbreviated source labels never become canonical names.
  const aliasTarget =
    DICTIONARY_ALIASES[key] ??
    DICTIONARY_ALIASES_CANONICAL.get(canonicalizeTerm(key));

  if (aliasTarget) {
    const aliasKey = normalizeTerm(aliasTarget);
    if (aliasKey) {
      const aliasMatch = dictionaryIndex.get(aliasKey) ?? dictionaryIndex.get(canonicalizeTerm(aliasKey));
      if (aliasMatch) {
        return aliasMatch;
      }
    }
  }

  const direct = dictionaryIndex.get(key) ?? dictionaryIndex.get(canonicalizeTerm(key));
  if (direct) {
    return direct;
  }

  return null;
}

function* iterateTopologyGeometries(topologyObject) {
  if (!topologyObject || typeof topologyObject !== "object") return;
  if (Array.isArray(topologyObject.geometries)) {
    for (const geom of topologyObject.geometries) {
      yield geom;
    }
  }
  if (topologyObject.type === "GeometryCollection" && Array.isArray(topologyObject.geometries)) {
    for (const geom of topologyObject.geometries) {
      yield geom;
    }
  }
}

function* iterateRecords(data) {
  if (!data) return;

  if (Array.isArray(data)) {
    for (const item of data) yield item;
    return;
  }

  if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
    for (const feature of data.features) yield feature;
    return;
  }

  if (data.type === "Topology" && data.objects && typeof data.objects === "object") {
    for (const obj of Object.values(data.objects)) {
      for (const geom of iterateTopologyGeometries(obj)) {
        yield geom;
      }
    }
    return;
  }

  if (typeof data === "object") {
    yield data;
  }
}

function translate(dictionaryIndex, term, lang) {
  const fallback = normalizeTerm(term);
  const match = resolveDictionaryMatch(dictionaryIndex, term);
  if (!match) {
    return fallback;
  }
  const translated = typeof match.entry?.[lang] === "string" ? match.entry[lang].trim() : "";
  return translated.length > 0 ? translated : fallback;
}

function overwriteCanonicalNameFields(target, canonicalEnglish) {
  const normalized = normalizeTerm(canonicalEnglish);
  if (!normalized || !target || typeof target !== "object") {
    return;
  }

  // Keep one canonical base name and mirror it into the legacy name/label slots.
  target.name = normalized;
  target.name_en = normalized;

  const mirrorKeys = [
    "NAME",
    "NAME_EN",
    "name",
    "name_en",
    "LABEL",
    "label",
    "moje_nazvy",
    "NAME_ALT",
    "name_alt",
    "NAMEALT",
  ];

  for (const key of mirrorKeys) {
    if (key in target) {
      target[key] = normalized;
    }
  }
}

function promoteNameEnAsPrimary(target) {
  if (!target || typeof target !== "object") {
    return;
  }

  const normalizedNameEn = normalizeTerm(target.name_en);
  if (!normalizedNameEn) {
    return;
  }

  overwriteCanonicalNameFields(target, normalizedNameEn);
}

function findEnglishName(record) {
  if (!record || typeof record !== "object") return null;
  const props = record.properties && typeof record.properties === "object" ? record.properties : null;

  if (record.name && typeof record.name === "object") {
    const common = normalizeTerm(record.name.common);
    if (common) return common;
    const official = normalizeTerm(record.name.official);
    if (official) return official;
  }

  for (const key of NAME_KEYS) {
    if (props && typeof props[key] === "string") {
      const value = normalizeTerm(props[key]);
      if (value) return value;
    }
  }

  for (const key of NAME_KEYS) {
    if (typeof record[key] === "string") {
      const value = normalizeTerm(record[key]);
      if (value) return value;
    }
  }

  return null;
}

function translateLanguagesContainer(languages, dictionaryIndex, lang) {
  if (!languages) return null;

  if (Array.isArray(languages)) {
    return languages.map((item) => {
      if (typeof item !== "string") return item;
      return translate(dictionaryIndex, item, lang) ?? item;
    });
  }

  if (typeof languages === "object") {
    const out = {};
    for (const [code, value] of Object.entries(languages)) {
      if (typeof value === "string") {
        out[code] = translate(dictionaryIndex, value, lang) ?? value;
      } else {
        out[code] = value;
      }
    }
    return out;
  }

  return null;
}

function injectIntoCountries(records, dictionaryIndex) {
  let touched = 0;
  for (const rec of records) {
    if (!rec || typeof rec !== "object") continue;

    const englishName =
      normalizeTerm(rec?.name?.common) ??
      normalizeTerm(rec?.name?.official);

    if (englishName) {
      rec.name_cs = translate(dictionaryIndex, englishName, "cs");
      rec.name_de = translate(dictionaryIndex, englishName, "de");
      touched += 1;
    }

    if (rec.languages) {
      const cs = translateLanguagesContainer(rec.languages, dictionaryIndex, "cs");
      const de = translateLanguagesContainer(rec.languages, dictionaryIndex, "de");
      if (cs) rec.languages_cs = cs;
      if (de) rec.languages_de = de;
    }
  }
  return touched;
}

function injectIntoRecord(record, dictionaryIndex) {
  if (!record || typeof record !== "object") return 0;

  let touched = 0;
  const props = record.properties && typeof record.properties === "object"
    ? record.properties
    : null;

  const englishName = findEnglishName(record);
  if (englishName) {
    const target = props ?? record;
    const match = resolveDictionaryMatch(dictionaryIndex, englishName);
    const canonicalEnglish = match?.englishKey || englishName;

    overwriteCanonicalNameFields(target, canonicalEnglish);
    target.name_cs = translate(dictionaryIndex, canonicalEnglish, "cs");
    target.name_de = translate(dictionaryIndex, canonicalEnglish, "de");
    touched += 1;
  }

  const languageBuckets = [record, props].filter(Boolean);
  for (const bucket of languageBuckets) {
    promoteNameEnAsPrimary(bucket);

    for (const [key, value] of Object.entries(bucket)) {
      if (key.toLowerCase() !== "languages") continue;
      const cs = translateLanguagesContainer(value, dictionaryIndex, "cs");
      const de = translateLanguagesContainer(value, dictionaryIndex, "de");
      if (cs) bucket.languages_cs = cs;
      if (de) bucket.languages_de = de;
    }
  }

  return touched;
}

async function writeJsonAtomic(filePath, data) {
  const tempPath = `${filePath}.tmp`;
  const json = `${JSON.stringify(data)}\n`;
  await fs.writeFile(tempPath, json, "utf8");
  await fs.rename(tempPath, filePath);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await fileExists(dictionaryPath))) {
    throw new Error(`Missing dictionary file: ${dictionaryPath}`);
  }

  const dictionary = await readJson(dictionaryPath);
  const dictionaryIndex = buildDictionaryIndex(dictionary);
  let scanned = 0;
  let touched = 0;

  for (const rel of SOURCE_FILES) {
    const fullPath = path.join(publicDir, rel);
    if (!(await fileExists(fullPath))) {
      console.warn(`[skip] Missing file: public/${rel}`);
      continue;
    }

    const data = await readJson(fullPath);
    let touchedInFile = 0;

    if (rel === "countries-full.json" && Array.isArray(data)) {
      touchedInFile = injectIntoCountries(data, dictionaryIndex);
    } else {
      for (const record of iterateRecords(data)) {
        touchedInFile += injectIntoRecord(record, dictionaryIndex);
      }
    }

    await writeJsonAtomic(fullPath, data);
    scanned += 1;
    touched += touchedInFile;
    console.log(`[ok] Updated public/${rel} (records touched: ${touchedInFile})`);
  }

  console.log(`\nDone.`);
  console.log(`Files updated: ${scanned}`);
  console.log(`Records touched: ${touched}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
