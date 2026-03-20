import { isWaterFeature, type PhysicalFeature } from "../../../utils/physicalFeatures";
import type { PhysicalGeoMode } from "./types";

export const marinesMode: PhysicalGeoMode = {
  key: "waters",
  dataNeeds: {
    marine: true,
    landMask: true,
    rivers: false,
    lakes: false,
  },
  includeMarineBackground: true,
  splitFeatures: (features) => {
    const waterFeatures: PhysicalFeature[] = [];
    const landFeatures: PhysicalFeature[] = [];

    for (const feature of features) {
      if (isWaterFeature(feature) && feature.shape.kind !== "marker") {
        waterFeatures.push(feature);
      } else {
        landFeatures.push(feature);
      }
    }

    return { waterFeatures, landFeatures };
  },
  getGeoFeatureKind: (feature) => (isWaterFeature(feature) ? "marine" : null),
  styleOverrides: {
    marine: {
      fillColor: "#0f2a4a",
      strokeColor: "rgba(148, 167, 190, 0.2)",
    },
  },
};
