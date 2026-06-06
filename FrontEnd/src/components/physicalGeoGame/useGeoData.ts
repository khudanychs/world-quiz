import { useRef, useMemo, useState, useEffect } from "react";
import { geoPath as d3GeoPath, geoNaturalEarth1, geoArea, type GeoPermissibleObjects } from "d3-geo";
import {
  GEO_LAND_URL,
  LAKES_URL,
  MARINE_URL,
  RIVERS_URL,
  extractGeoFeatureCollection,
  extractLandGeometry,
  type GeoFeatureCollection,
} from "./geo";
import type { PhysicalGeoMode } from "./modes/types";
import { MapDataService } from "../../services/MapDataService";

export function useGeoData(
  categoryKey: string | null,
  activeMode: PhysicalGeoMode,
  FIT_SCALE: number,
  INNER_W: number,
  INNER_H: number
) {
  const hasActiveMode = !!categoryKey;
  const needsMarine = hasActiveMode && activeMode.dataNeeds.marine;
  const needsRivers = hasActiveMode && activeMode.dataNeeds.rivers;
  const needsLakes = hasActiveMode && activeMode.dataNeeds.lakes;
  const needsDetailedLandMask = hasActiveMode && activeMode.dataNeeds.landMask;
  const usesTopoLandBase = hasActiveMode && !needsDetailedLandMask;

  const riverGeoCache = useRef<GeoFeatureCollection | null>(null);
  const lakeGeoCache = useRef<GeoFeatureCollection | null>(null);

  const [marineData, setMarineData] = useState<GeoFeatureCollection | null>(null);
  const [landGeoRaw, setLandGeoRaw] = useState<GeoPermissibleObjects | null>(null);
  const [riverData, setRiverData] = useState<GeoFeatureCollection | null>(null);
  const [lakeData, setLakeData] = useState<GeoFeatureCollection | null>(null);
  const [geographiesReady, setGeographiesReady] = useState(false);

  useEffect(() => {
    if (!usesTopoLandBase) {
      setGeographiesReady(false);
      return;
    }
    setGeographiesReady(false);
  }, [categoryKey, usesTopoLandBase]);

  useEffect(() => {
    if (!needsMarine && !needsDetailedLandMask) {
      setMarineData(null);
      setLandGeoRaw(null);
      return;
    }

    MapDataService.loadBaseMapData(needsDetailedLandMask, needsMarine)
      .then(({ landGeoRaw, marineData }) => {
        setLandGeoRaw(needsDetailedLandMask && landGeoRaw ? landGeoRaw : null);
        setMarineData(needsMarine && marineData ? marineData : null);
      })
      .catch((err) => console.error("Worker data load failed:", err));
  }, [needsMarine, needsDetailedLandMask]);

  useEffect(() => {
    if (!needsRivers) {
      setRiverData(null);
      return;
    }
    if (riverGeoCache.current) {
      setRiverData(riverGeoCache.current);
      return;
    }
    fetch(RIVERS_URL)
      .then(r => r.json())
      .then((raw: unknown) => {
        const extracted = extractGeoFeatureCollection(raw, ["rivers", "river", "waterways"]);
        if (!extracted) {
          setRiverData(null);
          return;
        }
        riverGeoCache.current = extracted;
        setRiverData(extracted);
      })
      .catch(() => {});
  }, [needsRivers]);

  useEffect(() => {
    if (!needsLakes) {
      setLakeData(null);
      return;
    }
    if (lakeGeoCache.current) {
      setLakeData(lakeGeoCache.current);
      return;
    }
    fetch(LAKES_URL)
      .then(r => r.json())
      .then((raw: unknown) => {
        const extracted = extractGeoFeatureCollection(raw, ["lakes", "lake", "water"]);
        if (!extracted) {
          setLakeData(null);
          return;
        }
        lakeGeoCache.current = extracted;
        setLakeData(extracted);
      })
      .catch(() => {});
  }, [needsLakes]);

  const landPathD = useMemo<string | null>(() => {
    if (!landGeoRaw) return null;
    const proj = geoNaturalEarth1().scale(FIT_SCALE).translate([INNER_W / 2, INNER_H / 2]).center([0, 15]);
    return d3GeoPath(proj)(landGeoRaw) || null;
  }, [landGeoRaw, FIT_SCALE, INNER_W, INNER_H]);

  const baseMapReady = needsDetailedLandMask ? !!landPathD : geographiesReady;

  const requiredDataLoaded = useMemo(() => {
    if (!hasActiveMode) return true;
    if (activeMode.dataNeeds.marine && !marineData) return false;
    if (activeMode.dataNeeds.rivers && !riverData) return false;
    if (activeMode.dataNeeds.lakes && !lakeData) return false;
    return true;
  }, [hasActiveMode, activeMode, marineData, riverData, lakeData]);

  return {
    marineData,
    landGeoRaw,
    riverData,
    lakeData,
    landPathD,
    baseMapReady,
    geographiesReady,
    setGeographiesReady,
    requiredDataLoaded,
    needsDetailedLandMask,
    usesTopoLandBase,
    hasActiveMode,
  };
}
