import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrlWithLanguage, getSeoOgImage } from '../seo/seo-translations';
import CountryDetails from './CountryDetails';
import { FLAG_MATCH_SPECIAL_TERRITORIES, getLocalizedCapitals, getLocalizedCountryName } from '../utils/countries';
import { getLocalizedName } from '../utils/i18nUtils';
import { buildLocalizedPath } from '../utils/localeRouting';
import { getBaseLanguage } from '../utils/localeRouting';
import { fetchCountriesData } from '../utils/countriesData';
import './CountryIndex.css';

interface Country {
  name: string;
  name_cs: string;
  name_de: string;
  officialName: string;
  officialName_cs: string;
  officialName_de: string;
  cca2: string;
  cca3: string;
  capital: string[];
  region: string;
  subregion: string;
  subregion_cs: string;
  subregion_de: string;
  languages: Record<string, string>;
  languages_cs: Record<string, string>;
  languages_de: Record<string, string>;
}

const countriesCacheByLanguage = new Map<string, Country[]>();

function FlagImage({ code, name, eager = false }: { code: string; name: string; eager?: boolean }) {
  const { t } = useTranslation();
  return (
    <img
      src={`/flags-v2/${code.toLowerCase()}.svg`}
      alt={t('countryIndex.flagAlt', { name })}
      className="country-card-flag"
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      width="48"
      height="36"
    />
  );
}

export default function CountryIndex() {
  const seo = SEO_TRANSLATIONS.routes.countries;
  const { i18n, t } = useTranslation();
  const currentLanguage = getBaseLanguage(i18n.language);
  const navigate = useNavigate();
  const { countryCode } = useParams<{ countryCode?: string }>();
  
  const [countries, setCountries] = useState<Country[]>(() => {
    return countriesCacheByLanguage.get(currentLanguage) || [];
  });
  const [loading, setLoading] = useState(() => {
    return !countriesCacheByLanguage.has(currentLanguage);
  });
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  // Derive selection during render so a detail URL never briefly loads the full flag grid.
  const selectedCountry = useMemo(() => countryCode
    ? countries.find(country => country.cca2 === countryCode.toUpperCase()) ?? null
    : null, [countries, countryCode]);

  const getLocalizedOfficialName = (country: Country) => getLocalizedName(
    {
      officialName: country.officialName,
      officialName_cs: country.officialName_cs,
      officialName_de: country.officialName_de,
    },
    currentLanguage,
    'officialName'
  );

  useEffect(() => {
    let active = true;
    setLoadError("");
    const cachedCountries = countriesCacheByLanguage.get(currentLanguage);
    if (cachedCountries) {
      setCountries(cachedCountries);
      setLoading(false);
      return;
    }

    const loadCountries = async () => {
      try {
        setLoading(true);
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
              name: getLocalizedCountryName(c, currentLanguage, { preferOfficial: false }) || getLocalizedName(localizedCommonNameProps, currentLanguage, 'name'),
              name_cs: localizedCommonNameProps.name_cs || '',
              name_de: localizedCommonNameProps.name_de || '',
              officialName: displayNameBase,
              officialName_cs: displayNameCs || '',
              officialName_de: displayNameDe || '',
              cca2: c.cca2,
              cca3: c.cca3,
              capital: getLocalizedCapitals(c, currentLanguage),
              region: c.region || 'Unknown',
              subregion: c.subregion || '',
              subregion_cs: c.subregion_cs || '',
              subregion_de: c.subregion_de || '',
              languages: c.languages || {},
              languages_cs: c.languages_cs || {},
              languages_de: c.languages_de || {},
            };
          });
        
        formattedCountries.sort((a, b) => a.officialName.localeCompare(b.officialName));

        countriesCacheByLanguage.set(currentLanguage, formattedCountries);
        if (!active) return;
        setCountries(formattedCountries);
        setLoading(false);
        
      } catch (error) {
        if (!active) return;
        console.error('Failed to load countries:', error);
        setLoadError(error instanceof Error ? error.message : "Failed to load countries");
        setLoading(false);
      }
    };

    loadCountries();
    return () => { active = false; };
  }, [currentLanguage]);


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
    Antarctic: 'countryIndex.regions.antarctic',
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

  const handleCloseDetails = () => {
    navigate(buildLocalizedPath('/countries', i18n.language));
  };

  useEffect(() => {
    if (!loading && countries.length > 0 && countryCode && !selectedCountry) {
      navigate(buildLocalizedPath('/countries', i18n.language), { replace: true });
    }
  }, [loading, countryCode, countries, selectedCountry, i18n.language, navigate]);

  if (loading) {
    return (
      <div className="country-index-wrap">
        {countryCode ? (
          <div className="country-detail-modal">
            <article className="country-detail-content">
              <div className="country-detail-loading">{t('countryIndex.loading')}</div>
            </article>
          </div>
        ) : (
          <div className="country-loading">{t('countryIndex.loading')}</div>
        )}
      </div>
    );
  }

  return (
    <>
      <SEOHelmet
        title={selectedCountry ? t('countryIndex.seoTitleWithCountry', { country: getLocalizedOfficialName(selectedCountry) }) : seo.title}
        description={selectedCountry ? t('countryIndex.seoDescriptionWithCountry', { country: getLocalizedOfficialName(selectedCountry) }) : seo.description}
        canonicalUrl={selectedCountry ? toCanonicalUrlWithLanguage(`/countries/${selectedCountry.cca2.toLowerCase()}`, currentLanguage) : toCanonicalUrlWithLanguage(seo.path, currentLanguage)}
        ogImage={getSeoOgImage(seo)}
        preserveExplicitMeta={!!selectedCountry}
        contentReady={!countryCode || !!selectedCountry}
        contentError={loadError}
      />
      
      <div 
        className="country-index-wrap"
        aria-hidden={!!selectedCountry}
        style={selectedCountry ? { visibility: 'hidden' } : undefined}
      >
        <div className="country-index-container">
          <>
            <header className="country-index-header">
              <h1>{t('countryIndex.title')}</h1>
              <p>{t('countryIndex.subtitle', { count: countries.length })}</p>
            </header>
            {loadError && <p role="alert">{t('countryDetails.errorPrefix')} {loadError}</p>}

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
                  <Link
                    key={country.cca2}
                    className="country-card"
                    to={buildLocalizedPath(`/countries/${country.cca2.toLowerCase()}`, currentLanguage)}
                  >
                    <FlagImage code={country.cca2} name={country.name} eager={!selectedCountry && index < 36} />
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
                        {country.capital.length ? country.capital.join(', ') : 'N/A'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        </div>
      </div>

      {/* Tady je kouzlo. Modal se jen vykreslí přes to všechno výše. */}
      {selectedCountry && (
        <CountryDetails
          country={selectedCountry}
          onClose={handleCloseDetails}
        />
      )}
    </>
  );
}
