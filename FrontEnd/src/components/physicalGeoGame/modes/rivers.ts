import type { PhysicalFeature } from "../../../utils/physicalFeatures";
import type { PhysicalGeoMode } from "./types";

const EMPTY_WATER: PhysicalFeature[] = [];
const LAND_TYPE_ORDER: Record<string, number> = { river: 0, lake: 1 };

export const riversMode: PhysicalGeoMode = {
  key: "rivers",
  dataNeeds: {
    marine: false,
    landMask: false,
    rivers: true,
    lakes: true,
  },
  includeMarineBackground: false,
  splitFeatures: (features) => {
    const landFeatures = [...features].sort((a, b) => (LAND_TYPE_ORDER[a.type] ?? 0.5) - (LAND_TYPE_ORDER[b.type] ?? 0.5));
    return {
      waterFeatures: EMPTY_WATER,
      landFeatures,
    };
  },
  getGeoFeatureKind: (feature) => {
    if (feature.type === "river") {
      return "river";
    }
    if (feature.type === "lake") {
      return "lake";
    }
    return null;
  },
  styleOverrides: {
    river: {
      strokeWidth: 2.45,
      hitStrokeWidth: 12,
      outlineExtra: 1.35,
      glowExtra: 5,
    },
    lake: {
      fillBoost: 0.12,
      coreStrokeWidth: 0.13,
      outlineStrokeWidth: 0.15,
      glowStrokeWidth: 1.2,
      outlineColor: "rgba(9, 43, 79, 0.6)",
    },
  },
};
