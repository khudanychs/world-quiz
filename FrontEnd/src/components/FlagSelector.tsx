import {useState, useMemo} from 'react';
import './FlagSelector.css';

interface FlagSelectorProps {
  selectedFlag: string;
  onFlagSelect: (countryCode: string) => void;
}

// Dynamically import all flags from circle-flags package as URLs
const flagModules = import.meta.glob('/node_modules/circle-flags/flags/*.svg', { 
  eager: true, 
  query: '?url',
  import: 'default' 
}) as Record<string, string>;

// Build a map of country code -> URL
const flagUrlMap: Record<string, string> = {};
Object.entries(flagModules).forEach(([path, url]) => {
  const match = path.match(/\/([a-z-]+)\.svg$/);
  if (match) {
    flagUrlMap[match[1]] = url;
  }
});

// Get sorted list of available flag codes
const availableFlagCodes = Object.keys(flagUrlMap).sort();

// Export helper function for other components to get flag URL
export const getFlagUrl = (countryCode: string): string | null => {
  return flagUrlMap[countryCode.toLowerCase()] || null;
};

// Export the list of available flags
export const getAvailableFlags = () => availableFlagCodes;

export const FlagSelector = ({ selectedFlag, onFlagSelect }: FlagSelectorProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const availableFlags = useMemo(() => availableFlagCodes, []);

    const filteredCountryCodes = availableFlags.filter(code =>
        code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flag-selector">
      <div className="flag-selector-header">
        <h3>Select Your Flag</h3>
        <input
          type="text"
          placeholder="Search country code (e.g., us, gb, de)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flag-search-input"
        />
        <p className="flag-count">{filteredCountryCodes.length} flags available</p>
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
                src={flagUrlMap[countryCode]}
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

