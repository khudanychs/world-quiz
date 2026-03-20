import type { PhysicalGeoMode, PhysicalGeoModeKey } from "./types";
import { mountainsMode } from "./mountains";
import { desertsMode } from "./deserts";
import { riversMode } from "./rivers";
import { marinesMode } from "./marines";

const MODES: Record<PhysicalGeoModeKey, PhysicalGeoMode> = {
  mountains: mountainsMode,
  deserts: desertsMode,
  rivers: riversMode,
  waters: marinesMode,
};

export function getPhysicalGeoMode(key: string): PhysicalGeoMode {
  return MODES[(key as PhysicalGeoModeKey)] ?? mountainsMode;
}
