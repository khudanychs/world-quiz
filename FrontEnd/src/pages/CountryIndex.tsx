import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrl, getSeoOgImage } from '../seo/seo-translations';
import CountryDetails from './CountryDetails';
import { FLAG_MATCH_SPECIAL_TERRITORIES } from '../utils/countries';
import { getLocalizedName } from '../utils/i18nUtils';
import { buildLocalizedPath } from '../utils/localeRouting';
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

function LazyFlag({ code, name }: { code: string; name: string }) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const element = imageRef.current;
    if (!element) {
      setShouldLoad(true);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [code]);

  return (
    <img
      ref={imageRef}
      src={shouldLoad ? `/flags-v2/${code.toLowerCase()}.svg` : undefined}
      alt={`${name} flag`}
      className={`country-card-flag ${loaded ? 'is-loaded' : ''}`}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
    />
  );
}

export default function CountryIndex() {
  const seo = SEO_TRANSLATIONS.routes.countries;
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language.split('-')[0];
  const navigate = useNavigate();
  const { countryCode } = useParams<{ countryCode?: string }>();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const isCountryDetailRoute = !!countryCode;

  // Load countries from local JSON
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await fetch('/countries-full.json');
        const data = await response.json();
        
        // Countries that should use official name instead of common name
        const useOfficialName: Record<string, boolean> = {
          'CZ': true, // Czech Republic instead of Czechia
          'CD': true, // Democratic Republic of the Congo instead of DR Congo
          'RU': true, // Russian Federation instead of Russia   
        };
        
        // Filter only independent sovereign states + special territories
        const formattedCountries: Country[] = data
          .filter((c: any) => c.independent === true || FLAG_MATCH_SPECIAL_TERRITORIES.has(c.cca2))
          .map((c: any) => {
            const commonName = c.name?.common || c.name;
            const officialName = c.name?.official || c.name?.common || c.name;
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
            
            return {
              name: getLocalizedName(localizedCommonNameProps, currentLanguage, 'name'),
              name_cs: localizedCommonNameProps.name_cs,
              name_de: localizedCommonNameProps.name_de,
              officialName: useOfficialName[c.cca2] ? officialName : commonName,
              officialName_cs: localizedOfficialNameProps.officialName_cs,
              officialName_de: localizedOfficialNameProps.officialName_de,
              cca2: c.cca2,
              cca3: c.cca3,
              capital: Array.isArray(c.capital) ? c.capital : [c.capital || 'N/A'],
              region: c.region || 'Unknown',
              subregion: c.subregion || '',
            };
          });
        
        // Sort alphabetically by display name (officialName)
        formattedCountries.sort((a, b) => a.officialName.localeCompare(b.officialName));
        
        setCountries(formattedCountries);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load countries:', error);
        setLoading(false);
      }
    };

    loadCountries();
  }, [currentLanguage]);



  // Get unique regions from actual country data
  const regions = useMemo(() => {
    const regionSet = new Set<string>();
    countries.forEach(c => {
      if (c.region) regionSet.add(c.region);
    });
    return ['all', ...Array.from(regionSet).sort()];
  }, [countries]);

  // Filter countries based on search and region
  const filteredCountries = useMemo(() => {
    let filtered = countries;

    // Region filter
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(c => c.region === selectedRegion);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.officialName.toLowerCase().includes(search) ||
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
    setSelectedCountry(null);
    navigate(buildLocalizedPath('/countries', i18n.language));
  };

  // Handle URL param for selected country from /countries/:countryCode
  useEffect(() => {
    if (countries.length === 0) {
      return;
    }

    if (!countryCode) {
      setSelectedCountry(null);
      return;
    }

    const normalizedCode = countryCode.toUpperCase();
    const country = countries.find(c => c.cca2 === normalizedCode);
    if (country) {
      setSelectedCountry(country);
      return;
    }

    setSelectedCountry(null);
    navigate(buildLocalizedPath('/countries', i18n.language), { replace: true });
  }, [countryCode, countries, i18n.language, navigate]);

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
        title={selectedCountry ? `${selectedCountry.officialName} - Country Encyclopedia - World Quiz` : seo.title}
        description={selectedCountry ? `Explore facts about ${selectedCountry.officialName}: capital, population, area, languages, and neighboring countries.` : seo.description}
        canonicalUrl={selectedCountry ? toCanonicalUrl(`/countries/${selectedCountry.cca2.toLowerCase()}`) : toCanonicalUrl(seo.path)}
        ogImage={getSeoOgImage(seo)}
      />
      {!isCountryDetailRoute && (
        <div className="country-index-wrap">
          <div className="country-index-container">
            {/* Header */}
            <header className="country-index-header">
              <h1>{t('countryIndex.title')}</h1>
              <p>{t('countryIndex.subtitle', { count: countries.length })}</p>
            </header>

            {/* Stats Summary */}
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

            {/* Search and Filters */}
            <div className="country-search-section">
              <input
                type="text"
                className="country-search-input"
                placeholder={t('countryIndex.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="country-filter-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="all">{t('countryIndex.allRegions')}</option>
                {regions.filter(r => r !== 'all').map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Country Grid */}
            {filteredCountries.length === 0 ? (
              <div className="country-empty">
                <h3>{t('countryIndex.noCountriesFound')}</h3>
                <p>{t('countryIndex.tryAdjustingFilters')}</p>
              </div>
            ) : (
              <div className="country-grid">
                {filteredCountries.map(country => (
                  <article
                    key={country.cca2}
                    className="country-card"
                    onClick={() => handleCountryClick(country)}
                  >
                    <LazyFlag code={country.cca2} name={country.name} />
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
      )}

      {/* Detail Modal */}
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
