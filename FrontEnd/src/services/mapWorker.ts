/// <reference lib="webworker" />

/**
 * Web Worker: Offloads heavy GeoJSON parsing to background thread
 * 
 * Extracts and processes large map geometry data without blocking the main thread.
 * This enables smooth UI interactions during initial map load and mode switches.
 */

import { extractGeoFeatureCollection, extractLandGeometry, GEO_LAND_URL, MARINE_URL } from "../components/physicalGeoGame/geo";
import { geoArea } from "d3-geo";

self.onmessage = async (e: MessageEvent) => {
  const { id, type, params } = e.data;
  
  if (type === 'EXTRACT_LAND_AND_MARINE') {
    try {
      const { needsDetailedLandMask, needsMarine } = params;
      
      let landGeoRaw = null;
      let marineData = null;

      if (needsDetailedLandMask) {
        const r = await fetch(GEO_LAND_URL);
        const raw = await r.json();
        let geom = extractLandGeometry(raw, ["land", "geoland", "countries", "landmask"]);
        
        if (geom) {
          if (geoArea(geom as any) > 2 * Math.PI) {
            geom = {
              type: "MultiPolygon",
              coordinates: (geom as any).coordinates.map((poly: any) => poly.map((ring: any) => [...ring].reverse())),
            } as any;
          }
          landGeoRaw = geom;
        }
      }

      if (needsMarine) {
        const r = await fetch(MARINE_URL);
        const raw = await r.json();
        marineData = extractGeoFeatureCollection(raw, ["marine", "water", "ocean"]);
      }

      self.postMessage({ id, result: { landGeoRaw, marineData } });
    } catch (err: any) {
      self.postMessage({ id, error: err.message });
    }
  }
};
