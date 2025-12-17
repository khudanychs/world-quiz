import { useEffect, useMemo } from 'react';
import { useCountryStats, useExchangeRate } from '../hooks/useCountryStats';
import { BackButton } from '../components/BackButton';
import './CountryDetails.css';

interface Country {
  name: string;
  officialName: string;
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
  const stats = useCountryStats(country.cca2);
  
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
            Loading country details...
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
              Failed to load country details: {stats.error}
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
            aria-label="Close"
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
              alt={`Flag of ${country.officialName}`}
              className="country-detail-flag"
            />
            <div className="country-detail-title">
              <h1>{country.officialName}</h1>
              <p className="capital">
                Capital: {country.capital[0] || 'N/A'}
              </p>
              {stats.subregion && (
                <span className="region">{stats.subregion}</span>
              )}
            </div>
          </header>

          {/* Stats Grid */}
          <div className="country-stats-grid">
            <div className="stat-box">
              <span className="stat-box-label">Population</span>
              <p className="stat-box-value">
                {formatNumber(stats.population)}
              </p>
              <p className="stat-box-subtext">
                {stats.population.toLocaleString()} people
              </p>
            </div>

            <div className="stat-box">
              <span className="stat-box-label">Area</span>
              <p className="stat-box-value">
                {formatNumber(stats.area)}
              </p>
              <p className="stat-box-subtext">
                {stats.area.toLocaleString()} km²
              </p>
            </div>

            {stats.population > 0 && stats.area > 0 && (
              <div className="stat-box">
                <span className="stat-box-label">Density</span>
                <p className="stat-box-value">
                  {(stats.population / stats.area).toFixed(1)}
                </p>
                <p className="stat-box-subtext">people per km²</p>
              </div>
            )}
          </div>

          {/* Currency Converter */}
          {currency && (
            <section className="country-detail-section">
              <h2>Currency</h2>
              <div className="currency-converter">
                <div className="currency-pair">
                  <span className="currency-amount">1 USD</span>
                  <span className="currency-symbol">=</span>
                  <span className="currency-amount">
                    {exchangeRate.loading ? (
                      '...'
                    ) : exchangeRate.error ? (
                      'N/A'
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
                    ' • Exchange rates updated daily'}
                </p>
              </div>
            </section>
          )}

          {/* Languages */}
          {stats.officialLanguages.length > 0 && (
            <section className="country-detail-section">
              <h2>Languages</h2>
              <div className="detail-list">
                {stats.officialLanguages.map((lang, idx) => (
                  <span key={idx} className="detail-chip">{lang}</span>
                ))}
              </div>
            </section>
          )}

          {/* Timezones */}
          {stats.timezones.length > 0 && (
            <section className="country-detail-section">
              <h2>Timezones</h2>
              <div className="detail-list">
                {stats.timezones.map((tz, idx) => (
                  <span key={idx} className="detail-chip">{tz}</span>
                ))}
              </div>
            </section>
          )}

          {/* Borders */}
          {stats.borderCountries.length > 0 && (
            <section className="country-detail-section">
              <h2>Bordering Countries</h2>
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
