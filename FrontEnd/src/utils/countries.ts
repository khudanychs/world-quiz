// Common country utilities for map and games

/** Map dataset short names to normalized names */
export function normalizeCountryName(raw: string): string {
  const map: Record<string, string> = {
    "Bosnia and Herz.": "Bosnia and Herzegovina",
    Congo: "Republic of the Congo",
    "Dem. Rep. Congo": "DR Congo",
    "Central African Rep.": "Central African Republic",
    "Eq. Guinea": "Equatorial Guinea",
    "Côte d'Ivoire": "Ivory Coast",
    "S. Sudan": "South Sudan",
    "Czech Rep.": "Czech Republic",
    "Wallis and Futuna Is.": "Wallis and Futuna",
    "Cook Is.": "Cook Islands",
    "Fr. Polynesia": "French Polynesia",
    "N. Cyprus": "Northern Cyprus",
    "W. Sahara": "Western Sahara",
  };
  return map[raw] ?? raw;
}

/** Some names differ between map dataset and REST Countries */
export const restAliases: Record<string, string> = {
  "United States of America": "United States",
  "Cabo Verde": "Cape Verde",
  "Wallis and Futuna Is.": "Wallis and Futuna",
  "Cook Is.": "Cook Islands",
  "Fr. Polynesia": "French Polynesia",
};

export const normalizeApos = (s: string) => s.replace(/\u2019/g, "'");
export const stripDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * Territories and regions that should NOT be clickable in ANY game mode
 * These are geographic features, disputed areas, or dependencies
 */
const nonClickableTerritories = new Set<string>([
  // Geographic features (not countries)
  "Siachen Glacier",
  
  // Disputed/occupied territories
  "Crimea", "Crimean Peninsula", "Northern Cyprus", "W. Sahara",
  
  // French overseas territories
  "French Guiana", "Guadeloupe", "Martinique", "Réunion", "Mayotte",
  "New Caledonia", "French Polynesia", "Wallis and Futuna",
  "St. Pierre and Miquelon", "Saint Barthélemy", "Saint Martin",
  
  // British overseas territories
  "Falkland Islands", "British Virgin Islands", "Cayman Islands",
  "Turks and Caicos Islands", "Bermuda", "Gibraltar", "Anguilla",
  "Montserrat", "British Indian Ocean Territory",
  "South Georgia and South Sandwich Islands", "Pitcairn Islands", "Saint Helena",
  
  // Dutch overseas territories
  "Aruba", "Curaçao", "Sint Maarten", "Caribbean Netherlands",
  
  // US territories
  "Puerto Rico", "U.S. Virgin Islands", "Guam", "Northern Mariana Islands", "American Samoa",
  
  // Danish autonomous territories
  "Faroe Islands",
  // Note: Greenland is NOT excluded - it's playable in the flag game
  
  // New Zealand territories
  "Cook Islands", "Niue", "Tokelau",
  
  // Australian territories
  "Norfolk Island", "Christmas Island", "Cocos Islands",
  
  // Portuguese autonomous regions
  "Azores", "Madeira",
  
  // Spanish autonomous regions
  "Canary Islands",
  
  // Norwegian territories
  "Svalbard", "Jan Mayen",
  
  // Finnish autonomous region
  "Åland",
]);

/**
 * Cached set of game-eligible countries fetched from REST Countries API
 * Populated when buildRestLookup is called
 */
let gameEligibleCountriesCache: Set<string> | null = null;

/**
 * Check if a country is eligible for game modes
 * Only countries from REST Countries API (UN members + independent) are eligible
 */
export function isGameEligibleCountry(rawName: string): boolean {
  const name = normalizeCountryName(rawName);
  
  // Check if it's explicitly non-clickable (territories, geographic features, etc.)
  if (nonClickableTerritories.has(name)) {
    return false;
  }
  
  // Use cache if available
  if (gameEligibleCountriesCache) {
    // Check the name and common variations
    if (gameEligibleCountriesCache.has(name)) return true;
    
    // Try normalized version
    const normalized = normalizeApos(name);
    if (gameEligibleCountriesCache.has(normalized)) return true;
    
    // Try without diacritics
    const stripped = stripDiacritics(normalized);
    if (gameEligibleCountriesCache.has(stripped)) return true;
    
    return false;
  }
  
  // Default to false if cache not yet initialized
  // This prevents random map features from being clickable before API loads
  return false;
}

/**
 * Initialize the game-eligible countries cache from REST Countries API
 * Includes all UN members and independent countries from the API
 */
export function initializeGameEligibleCountries(
  countries: Array<{ name: { common: string }; independent?: boolean; unMember?: boolean }>
): void {
  gameEligibleCountriesCache = new Set();
  
  // Special territories that should be playable despite not being UN members
  const specialPlayableTerritories = new Set(["Greenland", "Taiwan", "Kosovo", "Palestine"]);
  
  for (const country of countries) {
    const name = country.name.common;
    
    // Include all UN member states, independent countries, and special territories
    if (country.unMember || country.independent || specialPlayableTerritories.has(name)) {
      // Add the main name
      gameEligibleCountriesCache.add(name);
      
      // Add normalized versions
      gameEligibleCountriesCache.add(normalizeApos(name));
      gameEligibleCountriesCache.add(stripDiacritics(normalizeApos(name)));
      
      // Add specific common variations that appear in map data
      const variations: Record<string, string[]> = {
        "United States": ["United States of America", "USA"],
        "Cabo Verde": ["Cape Verde"],
        "Timor-Leste": ["East Timor"],
        "Czechia": ["Czech Republic"],
        "Democratic Republic of the Congo": ["DR Congo", "Dem. Rep. Congo", "DRC"],
        "Republic of the Congo": ["Congo", "Congo-Brazzaville"],
        "Côte d'Ivoire": ["Ivory Coast", "Cote d'Ivoire"],
        "Myanmar": ["Burma"],
        "Eswatini": ["Swaziland"],
        "North Macedonia": ["Macedonia"],
        "South Korea": ["Korea, South"],
        "North Korea": ["Korea, North"],
        "Palestine": ["State of Palestine"],
      };
      
      if (variations[name]) {
        variations[name].forEach(v => {
          gameEligibleCountriesCache!.add(v);
          gameEligibleCountriesCache!.add(normalizeApos(v));
          gameEligibleCountriesCache!.add(stripDiacritics(normalizeApos(v)));
        });
      }
    }
  }
}

/**
 * Build a lookup from REST Countries results to map names.
 * Uses common name, alias map, and diacritics/apos normalization.
 * Also initializes the game-eligible countries cache.
 * Flags are loaded from local /flags/ folder for reliability and speed.
 */
export function buildRestLookup(
  countries: Array<{
    name: { common: string };
    cca2: string;
    flags: { svg?: string; png?: string };
    independent?: boolean;
    unMember?: boolean;
  }>
): Record<string, { name: string; cca2: string; flag: string }> {
  // Initialize the game-eligible cache on first load
  initializeGameEligibleCountries(countries);
  
  const lookup: Record<string, { name: string; cca2: string; flag: string }> = {};

  const set = (key: string, val: { name: string; cca2: string; flag: string }) => {
    const k1 = normalizeApos(key);
    const k2 = stripDiacritics(k1);
    lookup[k1] = val;
    lookup[k2] = val;
  };

  for (const c of countries) {
    const common = c.name.common;
    // Use local flag files instead of external URLs for reliability and speed
    const flag = `/flags/${c.cca2.toLowerCase()}.svg`;
    const val = { name: common, cca2: c.cca2, flag };
    set(common, val);

    // Also store aliases we know
    for (const [from, to] of Object.entries(restAliases)) {
      if (to === common) {
        set(from, val);
      }
    }
  }
  
  return lookup;
}
