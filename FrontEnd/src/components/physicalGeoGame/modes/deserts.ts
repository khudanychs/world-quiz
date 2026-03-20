import type { PhysicalFeature } from "../../../utils/physicalFeatures";
import type { PhysicalGeoMode } from "./types";

const EMPTY_WATER: PhysicalFeature[] = [];

export const desertsMode: PhysicalGeoMode = {
  key: "deserts",
  dataNeeds: {
    marine: false,
    landMask: false,
    rivers: false,
    lakes: false,
  },
  includeMarineBackground: false,
  splitFeatures: (features) => ({
    waterFeatures: EMPTY_WATER,
    landFeatures: features,
  }),
  getGeoFeatureKind: () => null,
  styleOverrides: {
    desert: {
      fillBoost: 0.12,
      borderStrokeWidth: 1.1,
      textureOpacity: 0.5,
    },
  },
};
