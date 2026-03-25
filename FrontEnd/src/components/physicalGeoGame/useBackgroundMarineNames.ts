import { useMemo } from "react";
import type { GeoFeatureCollection } from "./geo";

export function useBackgroundMarineNames(
  includeMarineBackground: boolean,
  marineData: GeoFeatureCollection | null
): string[] {
  return useMemo(() => {
    if (!includeMarineBackground || !marineData) {
      return [] as string[];
    }

    const names = new Set<string>();
    for (const feature of marineData.features ?? []) {
      const props = feature.properties as Record<string, unknown> | undefined;
      const candidate = [
        props?.name,
        props?.Name,
        props?.NAME,
        props?.moje_nazvy,
      ].find((value) => typeof value === "string" && value.trim().length > 0) as string | undefined;
      if (candidate) {
        names.add(candidate.trim());
      }
    }
    return [...names];
  }, [includeMarineBackground, marineData]);
}
