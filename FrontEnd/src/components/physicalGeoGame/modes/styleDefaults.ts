import type { ModeStyleConfig, ModeStyleOverrides } from "./types";

export const BASE_MODE_STYLE: ModeStyleConfig = {
  desert: {
    fillBoost: 0.12,
    borderStrokeWidth: 1.8,
    textureOpacity: 0.5,
  },
  mountainRange: {
    bandWidth: 10,
    outlineWidth: 13,
    textureOpacity: 0.5,
  },
  river: {
    strokeWidth: 2.45,
    hitStrokeWidth: 12,
    outlineExtra: 1.35,
    glowExtra: 5,
  },
  marine: {
    fillColor: "#0f2a4a",
    strokeColor: "rgba(148, 167, 190, 0.2)",
  },
  lake: {
    fillBoost: 0.12,
    coreStrokeWidth: 0.13,
    outlineStrokeWidth: 0.15,
    glowStrokeWidth: 1.2,
    outlineColor: "rgba(9, 43, 79, 0.6)",
  },
};

export function resolveModeStyle(overrides: ModeStyleOverrides): ModeStyleConfig {
  return {
    desert: { ...BASE_MODE_STYLE.desert, ...(overrides.desert ?? {}) },
    mountainRange: { ...BASE_MODE_STYLE.mountainRange, ...(overrides.mountainRange ?? {}) },
    river: { ...BASE_MODE_STYLE.river, ...(overrides.river ?? {}) },
    marine: { ...BASE_MODE_STYLE.marine, ...(overrides.marine ?? {}) },
    lake: { ...BASE_MODE_STYLE.lake, ...(overrides.lake ?? {}) },
  };
}
