import type { PhysicalFeature } from "../../../utils/physicalFeatures";
import type { GeoFeatureKind } from "../geo";

export type PhysicalGeoModeKey = "mountains" | "deserts" | "rivers" | "waters";

export interface ModeStyleConfig {
  desert: {
    fillBoost: number;
    borderStrokeWidth: number;
    textureOpacity: number;
  };
  mountainRange: {
    bandWidth: number;
    outlineWidth: number;
    textureOpacity: number;
  };
  river: {
    strokeWidth: number;
    hitStrokeWidth: number;
    outlineExtra: number;
    glowExtra: number;
  };
  marine: {
    fillColor: string;
    strokeColor: string;
  };
  lake: {
    fillBoost: number;
    coreStrokeWidth: number;
    outlineStrokeWidth: number;
    glowStrokeWidth: number;
    outlineColor: string;
  };
}

export type ModeStyleOverrides = Partial<{
  [K in keyof ModeStyleConfig]: Partial<ModeStyleConfig[K]>;
}>;

export interface PhysicalGeoMode {
  key: PhysicalGeoModeKey;
  dataNeeds: {
    marine: boolean;
    landMask: boolean;
    rivers: boolean;
    lakes: boolean;
  };
  includeMarineBackground: boolean;
  splitFeatures: (features: PhysicalFeature[]) => {
    waterFeatures: PhysicalFeature[];
    landFeatures: PhysicalFeature[];
  };
  getGeoFeatureKind: (feature: PhysicalFeature) => GeoFeatureKind | null;
  styleOverrides: ModeStyleOverrides;
}
