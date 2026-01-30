// Lazy flag URL utilities - loads flags on demand instead of all at once

// Cache for loaded flag URLs
const flagUrlCache: Record<string, string> = {};

// Dynamically import flag URLs (lazy, not eager)
const flagModules = import.meta.glob('/node_modules/circle-flags/flags/*.svg', { 
  query: '?url',
  import: 'default' 
}) as Record<string, () => Promise<string>>;

// Build a list of available flag codes from the module keys
const availableFlagCodes: string[] = [];
Object.keys(flagModules).forEach((path) => {
  const match = path.match(/\/([a-z-]+)\.svg$/);
  if (match) {
    availableFlagCodes.push(match[1]);
  }
});
availableFlagCodes.sort();

// Export the list of available flags (this doesn't load the SVGs)
export const getAvailableFlags = () => availableFlagCodes;

// Check if a flag exists
export const hasFlag = (countryCode: string): boolean => {
  const code = countryCode.toLowerCase();
  return availableFlagCodes.includes(code);
};

// Get flag URL asynchronously - loads the SVG on demand
export const getFlagUrlAsync = async (countryCode: string): Promise<string | null> => {
  const code = countryCode.toLowerCase();
  
  // Check cache first
  if (flagUrlCache[code]) {
    return flagUrlCache[code];
  }
  
  // Find the module path
  const path = `/node_modules/circle-flags/flags/${code}.svg`;
  const loader = flagModules[path];
  
  if (!loader) {
    return null;
  }
  
  try {
    const url = await loader();
    flagUrlCache[code] = url;
    return url;
  } catch {
    return null;
  }
};

// Synchronous getter for cached flags (returns null if not loaded yet)
export const getFlagUrlSync = (countryCode: string): string | null => {
  const code = countryCode.toLowerCase();
  return flagUrlCache[code] || null;
};

// Preload a single flag
export const preloadFlag = async (countryCode: string): Promise<void> => {
  await getFlagUrlAsync(countryCode);
};

// Preload multiple flags
export const preloadFlags = async (countryCodes: string[]): Promise<void> => {
  await Promise.all(countryCodes.map(code => getFlagUrlAsync(code)));
};
