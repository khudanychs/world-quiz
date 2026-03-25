import type { PhysicalFeature } from "../../utils/physicalFeatures";
import type { ModeStyleOverrides } from "./modes/types";
import type { Proj } from "./renderers";

export interface MemoizedOverlayProps {
  projection: Proj;
  zoom: number;
  isDesktop: boolean;
  modeStyleOverrides: ModeStyleOverrides;
  waterFeatures: PhysicalFeature[];
  backgroundMarineNames: string[];
  landFeatures: PhysicalFeature[];
  getPrecomputedPath: (name: string, kind?: "marine" | "river" | "lake") => string | null;
  canClick: (feature: PhysicalFeature) => boolean;
  onFeatureClick: (featureName: string) => void;
  showingResult: boolean;
  lastResult: { correct: boolean; clickedName: string } | null;
  currentFeatureName: string | undefined;
  correctSet: Set<string>;
  skippedSet: Set<string>;
  visualStateKey: string;
}
