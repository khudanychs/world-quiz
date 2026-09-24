import { useState, useEffect } from 'react';
import { fetchCountriesData, getLoadedCountriesSync } from '../utils/countriesData';

interface CountryStats {
  population: number;
  area: number;
  currencies: Record<string, { name: string; symbol: string }>;
  region: string;
  subregion: string;
  officialLanguages: string[];
  timezones: string[];
  borders: string[];
  borderCountries: Array<{ cca2: string; cca3: string; name: string }>;
  loading: boolean;
  error: string | null;
}

interface ExchangeRate {
  rate: number;
  loading: boolean;
  error: string | null;
}

type CountryStatsData = Omit<CountryStats, 'loading' | 'error'>;

interface Timestamped<T> {
  value: T;
  savedAt: number;
}

const COUNTRY_STATS_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const EXCHANGE_RATE_TTL_MS = 1000 * 60 * 60 * 12;
const COUNTRY_STATS_STORAGE_KEY = 'wq_country_stats_cache_v1';
const EXCHANGE_RATE_STORAGE_KEY = 'wq_exchange_rate_cache_v1';

const countryStatsCache = new Map<string, Timestamped<CountryStatsData>>();
const exchangeRateCache = new Map<string, Timestamped<number>>();

function readStorageObject<T>(key: string): Record<string, Timestamped<T>> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    return parsed as Record<string, Timestamped<T>>;
  } catch {
    return {};
  }
}

function writeStorageObject<T>(key: string, source: Map<string, Timestamped<T>>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const serializable: Record<string, Timestamped<T>> = {};
    for (const [cacheKey, value] of source.entries()) {
      serializable[cacheKey] = value;
    }
    window.sessionStorage.setItem(key, JSON.stringify(serializable));
  } catch {
    // Ignore storage failures (private mode/quota).
  }
}

function hydrateCachesFromSessionStorage() {
  const statsEntries = readStorageObject<CountryStatsData>(COUNTRY_STATS_STORAGE_KEY);
  for (const [key, entry] of Object.entries(statsEntries)) {
    countryStatsCache.set(key, entry);
  }

  const rateEntries = readStorageObject<number>(EXCHANGE_RATE_STORAGE_KEY);
  for (const [key, entry] of Object.entries(rateEntries)) {
    exchangeRateCache.set(key, entry);
  }
}

hydrateCachesFromSessionStorage();

function getValidCachedValue<T>(
  cache: Map<string, Timestamped<T>>,
  key: string,
  ttlMs: number,
): T | null {
  const cached = cache.get(key);
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.savedAt > ttlMs) {
    cache.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedValue<T>(
  cache: Map<string, Timestamped<T>>,
  key: string,
  value: T,
  storageKey: string,
): void {
  cache.set(key, { value, savedAt: Date.now() });
  writeStorageObject(storageKey, cache);
}

function buildCountryStatsData(country: any, allCountries: any[]): CountryStatsData {
  const languageExclusions: Record<string, Set<string>> = {
    'CZ': new Set(['slk']), 
  };
  
  const officialLanguageCodes = country.name?.nativeName 
    ? Object.keys(country.name.nativeName)
    : [];
  
  const excludedCodes = languageExclusions[country.cca2] || new Set();
  const filteredCodes = officialLanguageCodes.filter((code: string) => !excludedCodes.has(code));
  
  const officialLangs = country.languages && filteredCodes.length > 0
    ? filteredCodes
        .map((code: string) => country.languages[code])
        .filter((lang: any) => lang)
    : Object.values(country.languages || {});
  
  const cca3ToCca2Map = new Map(
    allCountries.map((c: any) => [c.cca3, { cca2: c.cca2, name: c.name?.common || c.name }])
  );
  
  let borderCountries: Array<{ cca2: string; cca3: string; name: string }> = [];
  if (country.borders && country.borders.length > 0) {
    borderCountries = country.borders
      .map((cca3: string) => {
        const mapped = cca3ToCca2Map.get(cca3);
        return mapped ? { cca2: mapped.cca2, cca3, name: mapped.name } : { cca2: cca3, cca3, name: cca3 };
      });
  }

  return {
    population: country.population || 0,
    area: country.area || 0,
    currencies: country.currencies || {},
    region: country.region || '',
    subregion: country.subregion || '',
    officialLanguages: (officialLangs.length > 0 ? officialLangs : Object.values(country.languages || {})) as string[],
    timezones: country.timezones || [],
    borders: country.borders || [],
    borderCountries,
  };
}

/**
 * Fetches country statistics from local dataset
 * OPTIMIZATION: Check cache and loaded data first to eliminate flicker
 */
export function useCountryStats(cca2: string | null): CountryStats {
  const [data, setData] = useState<CountryStats>(() => {
    if (cca2) {
      const normalizedCca2 = cca2.toUpperCase();
      const cached = getValidCachedValue(countryStatsCache, normalizedCca2, COUNTRY_STATS_TTL_MS);
      if (cached) {
        return {
          ...cached,
          loading: false,
          error: null,
        };
      }

      const allCountries = getLoadedCountriesSync();
      if (allCountries) {
        const country = allCountries.find(
          (c: any) => (c.cca2 || '').toUpperCase() === normalizedCca2
        );
        if (country) {
          const statsData = buildCountryStatsData(country, allCountries);
          setCachedValue(countryStatsCache, normalizedCca2, statsData, COUNTRY_STATS_STORAGE_KEY);
          return {
            ...statsData,
            loading: false,
            error: null,
          };
        }
      }
    }
    return {
      population: 0,
      area: 0,
      currencies: {},
      region: '',
      subregion: '',
      officialLanguages: [],
      timezones: [],
      borders: [],
      borderCountries: [],
      loading: cca2 ? true : false,
      error: null,
    };
  });

  useEffect(() => {
    if (!cca2) {
      setData({
        population: 0,
        area: 0,
        currencies: {},
        region: '',
        subregion: '',
        officialLanguages: [],
        timezones: [],
        borders: [],
        borderCountries: [],
        loading: false,
        error: null,
      });
      return;
    }

    const normalizedCca2 = cca2.toUpperCase();
    const cached = getValidCachedValue(countryStatsCache, normalizedCca2, COUNTRY_STATS_TTL_MS);
    if (cached) {
      setData(prev => {
        const isSameData = prev.population === cached.population && 
                          prev.area === cached.area &&
                          !prev.loading;
        if (isSameData) return prev;
        
        return {
          ...cached,
          loading: false,
          error: null,
        };
      });
      return;
    }

    const fetchStats = async () => {
      try {
        const allCountries = (await fetchCountriesData()) as any[];
        const country = allCountries.find(
          (c: any) => (c.cca2 || '').toUpperCase() === normalizedCca2
        );

        if (!country) {
          throw new Error(`Country ${cca2} not found in local dataset`);
        }

        const nextData = buildCountryStatsData(country, allCountries);
        setCachedValue(countryStatsCache, normalizedCca2, nextData, COUNTRY_STATS_STORAGE_KEY);
        setData({
          ...nextData,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to load country data',
        }));
      }
    };

    fetchStats();
  }, [cca2]);

  return data;
}

/**
 * Fetches exchange rate for a currency vs USD
 * Uses fawazahmed0 exchange API (free, updated daily)
 */
export function useExchangeRate(currencyCode: string | null): ExchangeRate {
  const [data, setData] = useState<ExchangeRate>(() => {
    if (!currencyCode || currencyCode === 'USD') {
      return { rate: 1, loading: false, error: null };
    }
    const normalized = currencyCode.toLowerCase();
    const cachedRate = getValidCachedValue(exchangeRateCache, normalized, EXCHANGE_RATE_TTL_MS);
    if (cachedRate !== null) {
      return { rate: cachedRate, loading: false, error: null };
    }
    return { rate: 0, loading: false, error: null };
  });

  useEffect(() => {
    if (!currencyCode || currencyCode === 'USD') {
      setData({ rate: 1, loading: false, error: null });
      return;
    }

    const normalizedCurrencyCode = currencyCode.toLowerCase();
    const cachedRate = getValidCachedValue(exchangeRateCache, normalizedCurrencyCode, EXCHANGE_RATE_TTL_MS);
    if (cachedRate !== null) {
      setData({ rate: cachedRate, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    
    const fetchRate = async () => {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        // Try primary CDN endpoint
        let response = await fetch(
          `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json`,
          { signal: controller.signal }
        );
        
        // Fallback to GitHub Pages if CDN fails
        if (!response.ok) {
          response = await fetch(
            `https://latest.currency-api.pages.dev/v1/currencies/usd.json`,
            { signal: controller.signal }
          );
        }
        
        if (!response.ok) {
          throw new Error('Currency API unavailable');
        }
        
        const result = await response.json();
        const rate = result.usd?.[normalizedCurrencyCode];
        
        if (!rate) {
          throw new Error('Currency not found');
        }
        
        setCachedValue(exchangeRateCache, normalizedCurrencyCode, rate, EXCHANGE_RATE_STORAGE_KEY);
        setData({
          rate,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setData({
            rate: 0,
            loading: false,
            error: 'Exchange rate unavailable',
          });
        }
      }
    };

    fetchRate();

    return () => controller.abort();
  }, [currencyCode]);

  return data;
}
