import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrlWithLanguage, getSeoOgImage } from '../seo/seo-translations';
import CountryDetails from './CountryDetails';
import { FLAG_MATCH_SPECIAL_TERRITORIES } from '../utils/countries';
import { getLocalizedName } from '../utils/i18nUtils';
import { buildLocalizedPath } from '../utils/localeRouting';
import { getBaseLanguage } from '../utils/localeRouting';
import { fetchCountriesData } from '../utils/countriesData';
import './CountryIndex.css';

interface Country {
  name: string;
  name_cs?: string;
  name_de?: string;
  officialName: string;
  officialName_cs?: string;
  officialName_de?: string;
  cca2: string;
  cca3: string;
  capital: string[];
  region: string;
  subregion: string;
}

const countriesCacheByLanguage = new Map<string, Country[]>();
const warmedFlagsByLanguage = new Set<string>();
const warmedFlagSrcs = new Set<string>();
const warmingFlags = new Set<string>();

function getFlagSrc(code: string): string {
  return `/flags-v2/${code.toLowerCase()}.svg`;
}

function warmFlagImage(src: string): void {
  if (warmedFlagSrcs.has(src) || warmingFlags.has(src)) return;

  warmingFlags.add(src);
  const img = new Image();
  img.decoding = 'async';
  img.loading = 'eager';
  img.onload = () => {
    warmedFlagSrcs.add(src);
    warmingFlags.delete(src);
  };
  img.onerror = () => {
    warmingFlags.delete(src);
  };
  img.src = src;
}

function LazyFlag({ code, name, eager = false }: { code: string; name: string; eager?: boolean }) {
  const flagSrc = getFlagSrc(code);
  const [shouldLoad, setShouldLoad] = useState(eager || warmedFlagSrcs.has(flagSrc));
  const [loaded, setLoaded] = useState(warmedFlagSrcs.has(flagSrc));
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (eager) {
      setShouldLoad(true);
      return;
    }
    if (warmedFlagSrcs.has(flagSrc)) {
      setShouldLoad(true);
      setLoaded(true);
      return;
    }

    const element = imageRef.current;
    if (!element || !('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '900px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [eager, flagSrc]);

  return (
    <img
      ref={imageRef}
      src={shouldLoad ? flagSrc : undefined}
      alt={`${name} flag`}
      className={`country-card-flag ${loaded ? 'is-loaded' : ''}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => {
        warmedFlagSrcs.add(flagSrc);
        setLoaded(true);
      }}
    />
  );
}

export default function CountryIndex() {
  const seo = SEO_TRANSLATIONS.routes.countries;
  const { i18n, t } = useTranslation();
  const currentLanguage = getBaseLanguage(i18n.language);
  const navigate = useNavigate();
  const { countryCode } = useParams<{ countryCode?: string }>();
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  useEffect(() => {
    const cachedCountries = countriesCacheByLanguage.get(currentLanguage);
    if (cachedCountries) {
      setCountries(cachedCountries);
      setLoading(false);
      if (countryCode) {
        const normalizedCode = countryCode.toUpperCase();
        const country = cachedCountries.find(c => c.cca2 === normalizedCode);
        if (country) setSelectedCountry(country);
      }
      return;
    }

    const loadCountries = async () => {
      try {
        const data = await fetchCountriesData();
        const useOfficialName: Record<string, boolean> = {
          'CZ': true, 'CD': true, 'RU': true,
        };
        
        const formattedCountries: Country[] = data
          .filter((c: any) => c.independent === true || FLAG_MATCH_SPECIAL_TERRITORIES.has(c.cca2))
          .map((c: any) => {
            const commonName = c.name?.common || c.name;
            const officialName = c.name?.official || c.name?.common || c.name;
            const shouldUseOfficialName = !!useOfficialName[c.cca2];
            const displayNameBase = shouldUseOfficialName ? officialName : commonName;
            
            const localizedCommonNameProps = {
              name: commonName,
              name_cs: c.name_cs || c.translations?.ces?.common,
              name_de: c.name_de || c.translations?.deu?.common,
            };
            const localizedOfficialNameProps = {
              officialName,
              officialName_cs: c.official_name_cs || c.translations?.ces?.official,
              officialName_de: c.official_name_de || c.translations?.deu?.official,
            };
            
            const displayNameCs = shouldUseOfficialName
              ? (localizedOfficialNameProps.officialName_cs || localizedCommonNameProps.name_cs)
              : localizedCommonNameProps.name_cs;
            const displayNameDe = shouldUseOfficialName
              ? (localizedOfficialNameProps.officialName_de || localizedCommonNameProps.name_de)
              : localizedCommonNameProps.name_de;
            
            return {
              name: getLocalizedName(localizedCommonNameProps, currentLanguage, 'name'),
              name_cs: localizedCommonNameProps.name_cs,
              name_de: localizedCommonNameProps.name_de,
              officialName: displayNameBase,
              officialName_cs: displayNameCs,
              officialName_de: displayNameDe,
              cca2: c.cca2,
              cca3: c.cca3,
              capital: Array.isArray(c.capital) ? c.capital : [c.capital || 'N/A'],
              region: c.region || 'Unknown',
              subregion: c.subregion || '',
            };
          });
        
        formattedCountries.sort((a, b) => a.officialName.localeCompare(b.officialName));

        countriesCacheByLanguage.set(currentLanguage, formattedCountries);
        setCountries(formattedCountries);
        setLoading(false);
        
        if (countryCode) {
          const normalizedCode = countryCode.toUpperCase();
          const country = formattedCountries.find(c => c.cca2 === normalizedCode);
          if (country) setSelectedCountry(country);
        }
      } catch (error) {
        console.error('Failed to load countries:', error);
        setLoading(false);
      }
    };

    loadCountries();
  }, [currentLanguage, countryCode]);

  useEffect(() => {
    if (countries.length === 0 || warmedFlagsByLanguage.has(currentLanguage)) return;

    warmedFlagsByLanguage.add(currentLanguage);
    const hotList = countries.slice(0, 140);

    const warmChunk = (startIndex: number) => {
      const endIndex = Math.min(startIndex + 24, hotList.length);
      for (let i = startIndex; i < endIndex; i += 1) {
        warmFlagImage(getFlagSrc(hotList[i].cca2));
      }
      if (endIndex < hotList.length) {
        window.setTimeout(() => warmChunk(endIndex), 35);
      }
    };

    const handle = window.setTimeout(() => warmChunk(0), 80);
    return () => window.clearTimeout(handle);
  }, [countries, currentLanguage]);

  const regions = useMemo(() => {
    const regionSet = new Set<string>();
    countries.forEach(c => {
      if (c.region) regionSet.add(c.region);
    });
    return ['all', ...Array.from(regionSet).sort()];
  }, [countries]);

  const regionTranslationKeys: Record<string, string> = {
    Africa: 'countryIndex.regions.africa',
    Americas: 'countryIndex.regions.americas',
    Asia: 'countryIndex.regions.asia',
    Europe: 'countryIndex.regions.europe',
    Oceania: 'countryIndex.regions.oceania',
    Unknown: 'countryIndex.regions.unknown',
  };

  const getRegionLabel = (region: string) => {
    const key = regionTranslationKeys[region];
    return key ? t(key, { defaultValue: region }) : region;
  };

  const filteredCountries = useMemo(() => {
    let filtered = countries;
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(c => c.region === selectedRegion);
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.officialName.toLowerCase().includes(search) ||
        (c.name_cs || '').toLowerCase().includes(search) ||
        (c.name_de || '').toLowerCase().includes(search) ||
        (c.officialName_cs || '').toLowerCase().includes(search) ||
        (c.officialName_de || '').toLowerCase().includes(search) ||
        c.capital.some(cap => cap.toLowerCase().includes(search))
      );
    }
    return filtered;
  }, [countries, searchTerm, selectedRegion]);

  const handleCountryClick = (country: Country) => {
    setSelectedCountry(country);
    navigate(buildLocalizedPath(`/countries/${country.cca2.toLowerCase()}`, i18n.language));
  };

  const handleCloseDetails = () => {
    navigate(buildLocalizedPath('/countries', i18n.language));
  };

  useEffect(() => {
    if (countries.length === 0) return;
    if (!countryCode) {
      setSelectedCountry(null);
      return;
    }
    const normalizedCode = countryCode.toUpperCase();
    const country = countries.find(c => c.cca2 === normalizedCode);
    
    if (country && (!selectedCountry || selectedCountry.cca2 !== country.cca2)) {
      setSelectedCountry(country);
      return;
    }
    if (!country && selectedCountry) {
      setSelectedCountry(null);
      navigate(buildLocalizedPath('/countries', i18n.language), { replace: true });
    }
  }, [countryCode, countries, selectedCountry, i18n.language, navigate]);

  if (loading) {
    return (
      <div className="country-index-wrap">
        <div className="country-loading">{t('countryIndex.loading')}</div>
      </div>
    );
  }

  return (
    <>
      <SEOHelmet
        title={selectedCountry ? t('countryIndex.seoTitleWithCountry', { country: selectedCountry.officialName }) : seo.title}
        description={selectedCountry ? t('countryIndex.seoDescriptionWithCountry', { country: selectedCountry.officialName }) : seo.description}
        canonicalUrl={selectedCountry ? toCanonicalUrlWithLanguage(`/countries/${selectedCountry.cca2.toLowerCase()}`, currentLanguage) : toCanonicalUrlWithLanguage(seo.path, currentLanguage)}
        ogImage={getSeoOgImage(seo)}
        preserveExplicitMeta={!!selectedCountry}
      />
      
      {/* OPRAVA: Wrapper a Container se renderují vždycky, Modal je pouze nad nima! */}
      <div className="country-index-wrap">
        <div className="country-index-container">
          <header className="country-index-header">
            <h1>{t('countryIndex.title')}</h1>
            <p>{t('countryIndex.subtitle', { count: countries.length })}</p>
          </header>

          <div className="country-stats-summary">
            <div className="stat-card">
              <h3>{countries.length}</h3>
              <p>{t('countryIndex.stats.countries')}</p>
            </div>
            <div className="stat-card">
              <h3>{filteredCountries.length}</h3>
              <p>{t('countryIndex.stats.showing')}</p>
            </div>
          </div>

          <div className="country-search-section">
            <input
              id="country-search"
              type="text"
              className="country-search-input"
              placeholder={t('countryIndex.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              id="country-region"
              className="country-filter-select"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="all">{t('countryIndex.allRegions')}</option>
              {regions.filter(r => r !== 'all').map(region => (
                <option key={region} value={region}>{getRegionLabel(region)}</option>
              ))}
            </select>
          </div>

          {filteredCountries.length === 0 ? (
            <div className="country-empty">
              <h3>{t('countryIndex.noCountriesFound')}</h3>
              <p>{t('countryIndex.tryAdjustingFilters')}</p>
            </div>
          ) : (
            <div className="country-grid">
              {filteredCountries.map((country, index) => (
                <article
                  key={country.cca2}
                  className="country-card"
                  onClick={() => handleCountryClick(country)}
                >
                  <LazyFlag code={country.cca2} name={country.name} eager={index < 36} />
                  <div className="country-card-info">
                    <h2 className="country-card-name">
                      {getLocalizedName(
                        {
                          officialName: country.officialName,
                          officialName_cs: country.officialName_cs,
                          officialName_de: country.officialName_de,
                        },
                        currentLanguage,
                        'officialName'
                      )}
                    </h2>
                    <p className="country-card-capital">
                      {country.capital[0] || 'N/A'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tady je kouzlo. Modal se jen vykreslí přes to všechno výše. */}
      {selectedCountry && (
        <CountryDetails
          country={selectedCountry}
          onClose={handleCloseDetails}
          onCountryClick={(cca2) => {
            const borderCountry = countries.find(c => c.cca2 === cca2);
            if (borderCountry) {
              setSelectedCountry(borderCountry);
              navigate(buildLocalizedPath(`/countries/${borderCountry.cca2.toLowerCase()}`, i18n.language));
            }
          }}
        />
      )}
    </>
  );
}