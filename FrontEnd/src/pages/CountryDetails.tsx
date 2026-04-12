import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCountryStats, useExchangeRate } from '../hooks/useCountryStats';
import { BackButton } from '../components/BackButton';
import { getBaseLanguage } from '../utils/localeRouting';
import { getLocalizedName } from '../utils/i18nUtils';
import './CountryDetails.css';

interface Country {
  name: string;
  name_cs?: string;
  name_de?: string;
  officialName: string;
  officialName_cs?: string;
  officialName_de?: string;
  cca2: string;
  capital: string[];
  region: string;
  subregion: string;
}

interface CountryDetailsProps {
  country: Country;
  onClose: () => void;
  onCountryClick?: (cca2: string) => void;
}

export default function CountryDetails({ country, onClose, onCountryClick }: CountryDetailsProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = getBaseLanguage(i18n.language);
  const stats = useCountryStats(country.cca2);
  const displayCountryName = getLocalizedName(
    {
      officialName: country.officialName,
      officialName_cs: country.officialName_cs || country.name_cs,
      officialName_de: country.officialName_de || country.name_de,
    },
    currentLanguage,
    'officialName'
  );
  
  const handleBorderClick = (borderCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCountryClick) {
      onCountryClick(borderCode);
    }
  };
  
  // Get first currency code for exchange rate
  const currencyCode = useMemo(() => {
    const currencies = Object.keys(stats.currencies);
    return currencies.length > 0 ? currencies[0] : null;
  }, [stats.currencies]);

  const exchangeRate = useExchangeRate(currencyCode);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1)}B`;
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (stats.loading) {
    return (
      <div className="country-detail-modal" onClick={handleBackdropClick}>
        <div className="country-detail-content">
          <div className="country-detail-loading">
            {t('countryDetails.loading')}
          </div>
        </div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="country-detail-modal" onClick={handleBackdropClick}>
        <div className="country-detail-content">
          <div className="country-detail-close">
            <button className="country-detail-close-btn" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="country-detail-body">
            <div className="country-detail-error">
              {t('countryDetails.errorPrefix')} {stats.error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currency = stats.currencies[currencyCode || ''];

  return (
    <div className="country-detail-modal" onClick={handleBackdropClick}>
      <article className="country-detail-content">
        {/* Close Button */}
        <div className="country-detail-close">
          <BackButton 
            onClick={onClose}
            aria-label={t('countryDetails.close')}
            style={{
              position: 'relative',
              top: 'auto',
              left: 'auto',
            }}
          />
        </div>

        <div className="country-detail-body">
          {/* Header with Flag */}
          <header className="country-detail-header">
            <img
              src={`/flags-v2/${country.cca2.toLowerCase()}.svg`}
              alt={t('countryDetails.flagOf', { country: displayCountryName })}
              className="country-detail-flag"
            />
            <div className="country-detail-title">
              <h1>{displayCountryName}</h1>
              <p className="capital">
                {t('countryDetails.capital')}: {country.capital[0] || t('countryDetails.notAvailable')}
              </p>
              {stats.subregion && (
                <span className="region">{stats.subregion}</span>
              )}
            </div>
          </header>

          {/* Stats Grid */}
          <div className="country-stats-grid">
            <div className="stat-box">
              <span className="stat-box-label">{t('countryDetails.population')}</span>
              <p className="stat-box-value">
                {formatNumber(stats.population)}
              </p>
              <p className="stat-box-subtext">{t('countryDetails.peopleCount', { count: stats.population.toLocaleString() })}</p>
            </div>

            <div className="stat-box">
              <span className="stat-box-label">{t('countryDetails.area')}</span>
              <p className="stat-box-value">
                {formatNumber(stats.area)}
              </p>
              <p className="stat-box-subtext">{t('countryDetails.areaValue', { area: stats.area.toLocaleString() })}</p>
            </div>

            {stats.population > 0 && stats.area > 0 && (
              <div className="stat-box">
                <span className="stat-box-label">{t('countryDetails.density')}</span>
                <p className="stat-box-value">
                  {stats.population / stats.area > 1 ? (stats.population / stats.area).toFixed(1)
                  : (stats.population / stats.area).toPrecision(2)}
                </p>
                <p className="stat-box-subtext">{t('countryDetails.peoplePerKm2')}</p>
              </div>
            )}
          </div>

          {/* Currency Converter */}
          {currency && (
            <section className="country-detail-section">
              <h2>{t('countryDetails.currency')}</h2>
              <div className="currency-converter">
                <div className="currency-pair">
                  <span className="currency-amount">{t('countryDetails.oneUsd')}</span>
                  <span className="currency-amount">
                    {exchangeRate.loading ? (
                      '...'
                    ) : exchangeRate.error ? (
                      t('countryDetails.notAvailable')
                    ) : (
                      <>
                        {exchangeRate.rate.toFixed(2)} {currencyCode}
                      </>
                    )}
                  </span>
                </div>
                <p className="currency-rate-note">
                  {currency.name} ({currency.symbol || currencyCode})
                  {!exchangeRate.loading && !exchangeRate.error && 
                    ` ${t('countryDetails.exchangeRatesUpdated')}`}
                </p>
              </div>
            </section>
          )}

          {/* Languages */}
          {stats.officialLanguages.length > 0 && (
            <section className="country-detail-section">
              <h2>{t('countryDetails.languages')}</h2>
              <div className="detail-list">
                {stats.officialLanguages.map((lang) => (
                  <span key={lang} className="detail-chip">{lang}</span>
                ))}
              </div>
            </section>
          )}

          {/* Timezones */}
          {stats.timezones.length > 0 && (
            <section className="country-detail-section">
              <h2>{t('countryDetails.timezones')}</h2>
              <div className="detail-list">
                {stats.timezones.map((tz) => (
                  <span key={tz} className="detail-chip">{tz}</span>
                ))}
              </div>
            </section>
          )}

          {/* Borders */}
          {stats.borderCountries.length > 0 && (
            <section className="country-detail-section">
              <h2>{t('countryDetails.borderingCountries')}</h2>
              <div className="detail-list">
                {stats.borderCountries.map((border) => (
                  <span 
                    key={border.cca3} 
                    className="detail-chip clickable"
                    onClick={(e) => handleBorderClick(border.cca2, e)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleBorderClick(border.cca2, e as any)}
                    title={border.name}
                  >
                    {border.cca3}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
