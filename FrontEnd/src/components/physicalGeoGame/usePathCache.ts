import { useMemo, useRef } from "react";
import { geoPath as d3GeoPath, geoNaturalEarth1 } from "d3-geo";
import type { Proj } from "./renderers";
import type { GeoFeatureCollection, GeoFeature, GeoFeatureKind } from "./geo";

type GetGeoFeatureFunc = (name: string, kind?: GeoFeatureKind) => GeoFeature | null;

export function usePathCache(
  getGeoFeature: GetGeoFeatureFunc,
  FIT_SCALE: number,
  INNER_W: number,
  INNER_H: number,
  marineData: GeoFeatureCollection | null,
  riverData: GeoFeatureCollection | null,
  lakeData: GeoFeatureCollection | null
): (name: string, kind?: "marine" | "river" | "lake") => string | null {
  const pathCacheRef = useRef<{ key: string; cache: Map<string, string | null> }>({
    key: "",
    cache: new Map()
  });

  return useMemo(() => {
    const cacheKey = `${FIT_SCALE}-${INNER_W}-${INNER_H}-${marineData ? 'm' : ''}-${riverData ? 'r' : ''}-${lakeData ? 'l' : ''}`;
    if (pathCacheRef.current.key !== cacheKey) {
      pathCacheRef.current = { key: cacheKey, cache: new Map() };
    }
    const cache = pathCacheRef.current.cache;

    const proj = geoNaturalEarth1()
      .scale(FIT_SCALE)
      .translate([INNER_W / 2, INNER_H / 2])
      .center([0, 15]);
    const pathGen = d3GeoPath(proj);

    return (name: string, kind: "marine" | "river" | "lake" = "marine"): string | null => {
      const key = kind === "marine" ? name : `${kind}:${name}`;
      if (cache.has(key)) return cache.get(key)!;
      const feat = getGeoFeature(name, kind);
      if (!feat || !feat.geometry) {
        cache.set(key, null);
        return null;
      }
      const d = pathGen(feat.geometry) || null;
      cache.set(key, d);
      return d;
    };
  }, [getGeoFeature, FIT_SCALE, INNER_W, INNER_H, marineData, riverData, lakeData]);
}
