import { useState, useEffect } from 'react';

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

// Using fawazahmed0 exchange API - free, updated daily
// https://github.com/fawazahmed0/exchange-api

/**
 * Fetches country statistics from REST Countries API (only for detailed stats)
 * Uses local countries-full.json for border country mapping (ISO3 to ISO2)
 * Only fetches when cca2 is provided (when detail view is opened)
 */
export function useCountryStats(cca2: string | null): CountryStats {
  const [data, setData] = useState<CountryStats>({
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

    const controller = new AbortController();
    
    const fetchStats = async () => {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const response = await fetch(
          `https://restcountries.com/v3.1/alpha/${cca2}`,
          { signal: controller.signal }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch country data: ${response.statusText}`);
        }
        
        const [country] = await response.json();
        
        // Hardcoded exclusions for non-official languages
        const languageExclusions: Record<string, Set<string>> = {
          'CZ': new Set(['sk']), // Czechia: Slovak is not official
        };
        
        // Extract official languages from nativeName object (more accurate)
        // These are the languages used for official country names
        const officialLanguageCodes = country.name?.nativeName 
          ? Object.keys(country.name.nativeName)
          : [];
        
        // Apply exclusions if country has specific non-official languages
        const excludedCodes = languageExclusions[country.cca2] || new Set();
        const filteredCodes = officialLanguageCodes.filter((code: string) => !excludedCodes.has(code));
        
        // Get the actual language names for official language codes
        const officialLangs = country.languages && filteredCodes.length > 0
          ? filteredCodes
              .map((code: string) => country.languages[code])
              .filter((lang: any) => lang) // Remove undefined entries
          : Object.values(country.languages || {});
        
        // Fetch all countries to map cca3 to cca2 for borders
        let borderCountries: Array<{ cca2: string; cca3: string; name: string }> = [];
        if (country.borders && country.borders.length > 0) {
          try {
            const allCountriesRes = await fetch('/countries-full.json');
            const allCountries = await allCountriesRes.json();
            const cca3ToCca2Map = new Map(
              allCountries.map((c: any) => [c.cca3, { cca2: c.cca2, name: c.name.common }])
            );
            
            borderCountries = country.borders
              .map((cca3: string) => {
                const mapped = cca3ToCca2Map.get(cca3) as { cca2: string; name: string } | undefined;
                return mapped ? { cca2: mapped.cca2, cca3, name: mapped.name } : { cca2: cca3, cca3, name: cca3 };
              });
          } catch (err) {
            console.error('Failed to map border countries:', err);
          }
        }
        
        setData({
          population: country.population || 0,
          area: country.area || 0,
          currencies: country.currencies || {},
          region: country.region || '',
          subregion: country.subregion || '',
          officialLanguages: (officialLangs.length > 0 ? officialLangs : Object.values(country.languages || {})) as string[],
          timezones: country.timezones || [],
          borders: country.borders || [],
          borderCountries,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setData(prev => ({
            ...prev,
            loading: false,
            error: err.message || 'Failed to load country data',
          }));
        }
      }
    };

    fetchStats();

    return () => controller.abort();
  }, [cca2]);

  return data;
}

/**
 * Fetches exchange rate for a currency vs USD
 * Uses fawazahmed0 exchange API (free, updated daily)
 */
export function useExchangeRate(currencyCode: string | null): ExchangeRate {
  const [data, setData] = useState<ExchangeRate>({
    rate: 0,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!currencyCode || currencyCode === 'USD') {
      setData({ rate: 1, loading: false, error: null });
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
        const rate = result.usd?.[currencyCode.toLowerCase()];
        
        if (!rate) {
          throw new Error('Currency not found');
        }
        
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
