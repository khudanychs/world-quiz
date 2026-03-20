import type { PhysicalFeature } from "../../../utils/physicalFeatures";
import type { PhysicalGeoMode } from "./types";

const EMPTY_WATER: PhysicalFeature[] = [];

export const mountainsMode: PhysicalGeoMode = {
  key: "mountains",
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
    mountainRange: {
      bandWidth: 10,
      outlineWidth: 12,
      textureOpacity: 0.5,
    },
  },
};
