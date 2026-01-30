import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CountryDetails from './CountryDetails';
import { FLAG_MATCH_SPECIAL_TERRITORIES } from '../utils/countries';
import './CountryIndex.css';

interface Country {
  name: string;
  officialName: string;
  cca2: string;
  cca3: string;
  capital: string[];
  region: string;
  subregion: string;
}

export default function CountryIndex() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

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
            
            return {
              name: commonName,
              officialName: useOfficialName[c.cca2] ? officialName : commonName,
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
  }, []);



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
    setSearchParams({ country: country.cca2 });
  };

  const handleCloseDetails = () => {
    setSelectedCountry(null);
    setSearchParams({});
  };

  // Handle URL param for selected country
  useEffect(() => {
    const countryCode = searchParams.get('country');
    if (countryCode && countries.length > 0) {
      const country = countries.find(c => c.cca2 === countryCode);
      if (country) {
        setSelectedCountry(country);
      }
    }
  }, [searchParams, countries]);

  if (loading) {
    return (
      <div className="country-index-wrap">
        <div className="country-loading">Loading countries...</div>
      </div>
    );
  }

  return (
    <>
      <div className="country-index-wrap">
        <div className="country-index-container">
          {/* Header */}
          <header className="country-index-header">
            <h1>Country Encyclopedia</h1>
            <p>Explore detailed information about {countries.length} countries around the world</p>
          </header>

          {/* Stats Summary */}
          <div className="country-stats-summary">
            <div className="stat-card">
              <h3>{countries.length}</h3>
              <p>Countries</p>
            </div>
            <div className="stat-card">
              <h3>{filteredCountries.length}</h3>
              <p>Showing</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="country-search-section">
            <input
              type="text"
              className="country-search-input"
              placeholder="Search by country or capital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="country-filter-select"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="all">All Regions</option>
              {regions.filter(r => r !== 'all').map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          {/* Country Grid */}
          {filteredCountries.length === 0 ? (
            <div className="country-empty">
              <h3>No countries found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="country-grid">
              {filteredCountries.map(country => (
                <article
                  key={country.cca2}
                  className="country-card"
                  onClick={() => handleCountryClick(country)}
                >
                  <img
                    src={`/flags-v2/${country.cca2.toLowerCase()}.svg`}
                    alt={`${country.name} flag`}
                    className="country-card-flag"
                    loading="lazy"
                  />
                  <div className="country-card-info">
                    <h2 className="country-card-name">{country.officialName}</h2>
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

      {/* Detail Modal */}
      {selectedCountry && (
        <CountryDetails
          country={selectedCountry}
          onClose={handleCloseDetails}
          onCountryClick={(cca2) => {
            const borderCountry = countries.find(c => c.cca2 === cca2);
            if (borderCountry) {
              setSelectedCountry(borderCountry);
              setSearchParams({ country: borderCountry.cca2 });
            }
          }}
        />
      )}
    </>
  );
}
