/** Coordinates for small island nations that need visual markers (lon, lat) */
export const SMALL_ISLAND_MARKERS: Record<string, [number, number]> = {
  // Europe - UN Members + Vatican
  "Vatican City": [12.45, 41.9],
  "Monaco": [7.42, 43.73],
  "San Marino": [12.45, 43.94],
  "Liechtenstein": [9.55, 47.14],
  
  // Caribbean - UN Members only
  "Saint Lucia": [-60.98, 13.9],
  "Grenada": [-61.68, 12.1],
  "Saint Vincent and the Grenadines": [-61.2, 13.25],
  "Antigua and Barbuda": [-61.8, 17.1],
  "Dominica": [-61.37, 15.4],
  "Saint Kitts and Nevis": [-62.7, 17.3],
  "Barbados": [-59.5, 13.2],
  
  // Pacific Islands - UN Members only
  "Tonga": [-175.2, -21.2],
  "Samoa": [-172.1, -13.8],
  "Tuvalu": [179.2, -8.5],
  "Nauru": [166.9, -0.5],
  "Palau": [134.5, 7.5],
  "Marshall Islands": [171.2, 7.1],
  "Kiribati": [-157.4, 1.9],
  "Micronesia": [158.2, 6.9],
  
  // Indian Ocean - UN Members only
  "Maldives": [73.5, 3.2],
  "Seychelles": [55.5, -4.7],
  "Comoros": [43.9, -11.9],
  "Mauritius": [57.5, -20.3],
  
  // Africa - UN Members only
  "São Tomé and Príncipe": [6.6, 0.2],
  
  // Middle East - UN Members only
  "Bahrain": [50.6, 26.1],
  "Palestine": [35.2, 31.9],
};

/** 
 * Territories (non-UN members) that can appear with markers
 */
export const TERRITORY_MARKERS: Record<string, [number, number]> = {
  // New Zealand territories
  "Cook Islands": [-159.8, -21.2],
  "Niue": [-169.9, -19.1],
};
