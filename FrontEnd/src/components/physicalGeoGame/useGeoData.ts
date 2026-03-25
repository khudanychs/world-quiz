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

  const marineTopoCache = useRef<GeoFeatureCollection | null>(null);
  const landGeoCache = useRef<GeoPermissibleObjects | null>(null);
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
    if (!needsMarine) {
      setMarineData(null);
      return;
    }
    if (marineTopoCache.current) {
      setMarineData(marineTopoCache.current);
      return;
    }
    fetch(MARINE_URL)
      .then((r) => r.json())
      .then((raw: unknown) => {
        const extracted = extractGeoFeatureCollection(raw, ["marine", "water", "ocean"]);
        if (!extracted) {
          setMarineData(null);
          return;
        }
        marineTopoCache.current = extracted;
        setMarineData(extracted);
      })
      .catch(() => {});
  }, [needsMarine]);

  useEffect(() => {
    if (!needsDetailedLandMask) {
      setLandGeoRaw(null);
      return;
    }
    if (landGeoCache.current) {
      setLandGeoRaw(landGeoCache.current);
      return;
    }
    fetch(GEO_LAND_URL)
      .then((r) => r.json())
      .then((raw: unknown) => {
        let geom: GeoPermissibleObjects | null = extractLandGeometry(raw, ["land", "geoland", "countries", "landmask"]);

        if (!geom) return;
        type MultiPoly = { type: "MultiPolygon"; coordinates: number[][][][] };
        if (geoArea(geom as unknown as Parameters<typeof geoArea>[0]) > 2 * Math.PI) {
          geom = {
            type: "MultiPolygon",
            coordinates: (geom as unknown as MultiPoly).coordinates
              .map((poly) => poly.map((ring) => [...ring].reverse())),
          } as unknown as GeoPermissibleObjects;
        }
        landGeoCache.current = geom;
        setLandGeoRaw(geom);
      })
      .catch(() => {});
  }, [needsDetailedLandMask]);

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
