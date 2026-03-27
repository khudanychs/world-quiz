/**
 * Shared utility for fetching countries-full.json
 * Prevents duplicate fetches across components by caching the promise
 */

interface CountryData {
  name: { common: string; official: string };
  cca2: string;
  cca3: string;
  independent: boolean;
  capital?: string[];
  region: string;
  subregion: string;
  languages?: Record<string, string>;
  borders?: string[];
  name_cs?: string;
  name_de?: string;
  languages_cs?: Record<string, string>;
  languages_de?: Record<string, string>;
}

let countriesPromise: Promise<CountryData[]> | null = null;

/**
 * Fetches countries-full.json with caching
 * Multiple calls will share the same promise, preventing duplicate network requests
 */
export async function fetchCountriesData(): Promise<CountryData[]> {
  if (!countriesPromise) {
    countriesPromise = fetch('/countries-full.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load countries-full.json');
        }
        return response.json();
      })
      .catch((error) => {
        // Reset promise on error so next call will retry
        countriesPromise = null;
        throw error;
      });
  }
  
  return countriesPromise;
}

/**
 * Clears the cached promise (useful for testing or force-refresh scenarios)
 */
export function clearCountriesCache(): void {
  countriesPromise = null;
}
