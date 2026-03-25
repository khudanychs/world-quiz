import {useState, useEffect} from 'react';
import { useTranslation } from 'react-i18next';
import { getFlagUrlSync } from '../utils/flagUtils';
import './FlagSelector.css';

interface FlagSelectorProps {
  selectedFlag: string;
  onFlagSelect: (countryCode: string) => void;
}

export const FlagSelector = ({ selectedFlag, onFlagSelect }: FlagSelectorProps) => {
  const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [availableFlags, setAvailableFlags] = useState<string[]>([]);

    useEffect(() => {
      let cancelled = false;
      const loadManifest = async () => {
        try {
          const response = await fetch('/circle-flags-manifest.json', { cache: 'force-cache' });
          if (!response.ok) return;
          const data = (await response.json()) as string[];
          if (!cancelled) {
            setAvailableFlags(Array.isArray(data) ? data : []);
          }
        } catch {
          if (!cancelled) {
            setAvailableFlags([]);
          }
        }
      };
      loadManifest();
      return () => {
        cancelled = true;
      };
    }, []);
    
    const filteredCountryCodes = availableFlags.filter(code =>
        code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flag-selector">
      <div className="flag-selector-header">
        <h3>{t('flagSelector.title')}</h3>
        <input
          id="flag-search"
          name="flag-search"
          type="text"
          placeholder={t('flagSelector.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flag-search-input"
        />
        <p className="flag-count">{t('flagSelector.flagsAvailable', { count: filteredCountryCodes.length })}</p>
      </div>

      <div className="flag-grid">
        {filteredCountryCodes.map((countryCode) => (
            <button
              key={countryCode}
              type="button"
              onClick={() => onFlagSelect(countryCode)}
              className={`flag-option ${selectedFlag === countryCode ? 'selected' : ''}`}
              title={countryCode.toUpperCase()}
            >
              <img 
                src={getFlagUrlSync(countryCode) || ''}
                alt={countryCode.toUpperCase()}
                className="flag-svg"
                loading="lazy"
              />
            </button>
        ))}
      </div>
    </div>
    );
};

