/**
 * SPECIAL PLAYABLE TERRITORIES
 * These are included in Flag Match despite not being UN members.
 * Format: cca2 → { name, capitals }
 */
const SPECIAL_PLAYABLE: Record<string, { name: string; capitals: string[] }> = {
  TW: { name: "Taiwan", capitals: ["Taipei"] },
  EH: { name: "Western Sahara", capitals: ["El Aaiún"] },
  XK: { name: "Kosovo", capitals: ["Pristina"] },
  AQ: { name: "Antarctica", capitals: [] },
  GL: { name: "Greenland", capitals: ["Nuuk"] },
  PS: { name: "Palestine", capitals: ["Ramallah"] },
};

/**
 * HIDDEN TERRITORIES - Completely hidden from map rendering
 */
const HIDDEN_FROM_MAP: string[] = [
  "Fr. S. Antarctic Lands", "French Southern Territories"
];

/**
 * UNCLICKABLE TERRITORIES IN GAME MODES
 * Visible on map but clicking does nothing (won't break streaks).
 * Still fully interactive in Explore Map mode.
 */
const UNCLICKABLE_IN_GAMES: string[] = [
  // French territories
  "New Caledonia", "French Polynesia", "Wallis and Futuna", "French Guiana",
  "Martinique", "Guadeloupe", "Réunion", "Mayotte", "Saint Barthélemy", 
  "Saint Martin", "St. Pierre and Miquelon", "French Southern Territories",
  // British territories  
  "Falkland Islands", "British Virgin Islands", "Cayman Islands",
  "Turks and Caicos Islands", "Bermuda", "Gibraltar", "Anguilla",
  "Montserrat", "British Indian Ocean Territory", "Pitcairn Islands",
  "South Georgia and South Sandwich Islands", "Saint Helena",
  // US territories
  "Puerto Rico", "U.S. Virgin Islands", "Guam", "Northern Mariana Islands", "American Samoa",
  // Other territories
  "Faroe Islands", "Cook Islands", "Niue", "Tokelau", "Norfolk Island",
  "Christmas Island", "Cocos Islands", "Svalbard and Jan Mayen", "Åland Islands"
];

/**
 * NAME MAPPINGS - Map dataset names → Normalized display names
 * The map uses abbreviated names, we want full names for display.
 */
const MAP_TO_DISPLAY: Record<string, string> = {
  // Abbreviations
  "Bosnia and Herz.": "Bosnia and Herzegovina",
  "Central African Rep.": "Central African Republic",
  "Czech Rep.": "Czech Republic",
  "Dem. Rep. Congo": "DR Congo",
  "Dominican Rep.": "Dominican Republic",
  "Eq. Guinea": "Equatorial Guinea",
  "Falkland Is.": "Falkland Islands",
  "Fr. Polynesia": "French Polynesia",
  "Fr. S. Antarctic Lands": "French Southern Territories",
  "S. Sudan": "South Sudan",
  "Solomon Is.": "Solomon Islands",
  "W. Sahara": "Western Sahara",
  "Wallis and Futuna Is.": "Wallis and Futuna",
  "Cook Is.": "Cook Islands",
  // Name variations
  "United States of America": "United States",
  "Congo": "Republic of the Congo",
  "Côte d'Ivoire": "Ivory Coast",
  "Czechia": "Czech Republic",
  "Macedonia": "North Macedonia",
  "eSwatini": "Eswatini",
};

/**
 * DISPLAY TO REST API - Map our display names → REST Countries API names
 * Only needed where they differ.
 */
const DISPLAY_TO_REST: Record<string, string> = {
  "Czech Republic": "Czechia",
  "DR Congo": "Democratic Republic of the Congo",
  "Ivory Coast": "Côte d'Ivoire"
};

// ============================================================================
// EXPORTS - Functions and sets used by other modules
// ============================================================================

/** Set of cca2 codes for special playable territories */
export const FLAG_MATCH_SPECIAL_TERRITORIES = new Set(Object.keys(SPECIAL_PLAYABLE));

/** Normalize map names to display names */
export function normalizeCountryName(raw: string): string {
  return MAP_TO_DISPLAY[raw] ?? raw;
}

/** Check if territory is clickable in game modes */
export function isClickableInGameMode(nameRaw: string): boolean {
  const norm = normalizeCountryName(nameRaw);
  return !UNCLICKABLE_IN_GAMES.includes(norm) && !UNCLICKABLE_IN_GAMES.includes(nameRaw);
}

/** Check if territory should be completely hidden from map */
export function isHiddenTerritory(nameRaw: string): boolean {
  const norm = normalizeCountryName(nameRaw);
  return HIDDEN_FROM_MAP.includes(norm) || HIDDEN_FROM_MAP.includes(nameRaw);
}

/** Replace curly apostrophes with straight ones */
export const normalizeApos = (s: string) => s.replace(/\u2019/g, "'");

/** Remove diacritics (accents) from text */
export const stripDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// ============================================================================
// REST COUNTRIES INTEGRATION
// ============================================================================

type CountryInfo = { name: string; cca2: string; flag: string; region?: string };
type CountryData = { name: { common: string }; cca2: string; flags: { svg?: string; png?: string }; region?: string };

/** Build lookup table from REST Countries data */
export function buildRestLookup(countries: CountryData[]): Record<string, CountryInfo> {
  initializeGameEligibleCountries(countries);
  
  const lookup: Record<string, CountryInfo> = {};
  
  const addEntry = (key: string, val: CountryInfo) => {
    lookup[normalizeApos(key)] = val;
    lookup[stripDiacritics(normalizeApos(key))] = val;
  };

  for (const c of countries) {
    const name = c.name.common;
    const flag = `/flags-v2/${c.cca2.toLowerCase()}.svg`;
    const info = { name, cca2: c.cca2, flag, region: c.region };
    
    // Add main entry
    addEntry(name, info);
    
    // Add map name variations that point to this country
    for (const [mapName, displayName] of Object.entries(MAP_TO_DISPLAY)) {
      if (displayName === name || DISPLAY_TO_REST[displayName] === name) {
        addEntry(mapName, { ...info, name: displayName });
        addEntry(displayName, { ...info, name: displayName });
      }
    }
  }
  
  return lookup;
}

// ============================================================================
// GAME ELIGIBILITY CACHE
// ============================================================================

let gameEligibleCache: Set<string> | null = null;

export function isGameEligibleCountry(rawName: string): boolean {
  const name = normalizeCountryName(rawName);
  if (!gameEligibleCache) return false;
  
  return gameEligibleCache.has(name) || 
         gameEligibleCache.has(normalizeApos(name)) ||
         gameEligibleCache.has(stripDiacritics(normalizeApos(name)));
}

export function initializeGameEligibleCountries(
  countries: Array<{ name: { common: string }; independent?: boolean; unMember?: boolean }>
): void {
  gameEligibleCache = new Set();
  
  const specialNames = new Set(Object.values(SPECIAL_PLAYABLE).map(s => s.name));
  
  for (const c of countries) {
    const name = c.name.common;
    if (c.unMember || c.independent || specialNames.has(name)) {
      gameEligibleCache.add(name);
      gameEligibleCache.add(normalizeApos(name));
      gameEligibleCache.add(stripDiacritics(normalizeApos(name)));
      
      // Add display name variations
      for (const [_, displayName] of Object.entries(MAP_TO_DISPLAY)) {
        if (DISPLAY_TO_REST[displayName] === name) {
          gameEligibleCache.add(displayName);
        }
      }
    }
  }
}

// ============================================================================
// COUNTRY LOOKUP WITH CAPITALS (for Explore Map)
// ============================================================================

export type CountryInfoWithCapitals = { name: string; cca2: string; flag: string; capitals: string[] };

export function buildCountryLookupWithCapitals(
  countries: Array<{ name: { common: string }; cca2: string; flags: { svg?: string; png?: string }; capital?: string[] }>
): Record<string, CountryInfoWithCapitals> {
  const lookup: Record<string, CountryInfoWithCapitals> = {};
  
  const addEntry = (key: string, val: CountryInfoWithCapitals) => {
    lookup[normalizeApos(key)] = val;
    lookup[stripDiacritics(normalizeApos(key))] = val;
  };

  for (const c of countries) {
    const name = c.name.common;
    const flag = `/flags-v2/${c.cca2.toLowerCase()}.svg`;
    const info = { name, cca2: c.cca2, flag, capitals: c.capital || [] };
    
    addEntry(name, info);
    
    for (const [mapName, displayName] of Object.entries(MAP_TO_DISPLAY)) {
      if (displayName === name || DISPLAY_TO_REST[displayName] === name) {
        addEntry(mapName, { ...info, name: displayName });
        addEntry(displayName, { ...info, name: displayName });
      }
    }
  }
  
  // Add special territories from SPECIAL_PLAYABLE
  for (const [cca2, data] of Object.entries(SPECIAL_PLAYABLE)) {
    addEntry(data.name, { name: data.name, cca2, flag: `/flags-v2/${cca2.toLowerCase()}.svg`, capitals: data.capitals });
  }
  
  return lookup;
}

// Legacy export for backward compatibility
export const restAliases = MAP_TO_DISPLAY;
