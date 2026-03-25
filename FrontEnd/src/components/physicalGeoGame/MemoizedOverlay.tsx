import { memo } from "react";
import { renderLandOverlay as renderLandOverlaySvg, renderWaterUnderlay as renderWaterUnderlaySvg } from "./renderers";
import type { MemoizedOverlayProps } from "./types";

export const MemoizedOverlay = memo(function MemoizedOverlay({
  projection,
  zoom,
  isDesktop,
  modeStyleOverrides,
  waterFeatures,
  backgroundMarineNames,
  landFeatures,
  getPrecomputedPath,
  canClick,
  onFeatureClick,
  showingResult,
  lastResult,
  currentFeatureName,
  correctSet,
  skippedSet,
}: MemoizedOverlayProps) {
  return (
    <>
      {renderWaterUnderlaySvg({
        projection,
        zoom,
        isDesktop,
        modeStyleOverrides,
        waterFeatures,
        backgroundMarineNames,
        getPrecomputedPath,
        canClick,
        onFeatureClick,
        showingResult,
        lastResult,
        currentFeatureName,
        correctSet,
        skippedSet,
      })}
      {renderLandOverlaySvg({
        projection,
        zoom,
        isDesktop,
        modeStyleOverrides,
        landFeatures,
        getPrecomputedPath,
        canClick,
        onFeatureClick,
        showingResult,
        lastResult,
        currentFeatureName,
        correctSet,
        skippedSet,
      })}
    </>
  );
}, (prevProps, nextProps) => {
  // 1. Změnil se viditelný stav hry? PŘEKRESLIT!
  if (prevProps.visualStateKey !== nextProps.visualStateKey) return false;

  // 2. Skokový ZOOM (uživatel posunul kolečko nebo prsty zastavil).
  // Změna o víc než 0.1 je náš bezpečný práh, kdy víme, že se musí přepočítat scaleStroke.
  if (Math.abs(prevProps.zoom - nextProps.zoom) > 0.1) return false;

  // 3. Změnil se počet objektů na obrazovce (nová úroveň, nebo loading hotov)? PŘEKRESLIT!
  if (prevProps.waterFeatures.length !== nextProps.waterFeatures.length) return false;
  if (prevProps.landFeatures.length !== nextProps.landFeatures.length) return false;

  // 4. Je tohle jiný prohlížeč (změnilo se isDesktop)? PŘEKRESLIT!
  if (prevProps.isDesktop !== nextProps.isDesktop) return false;

  // VE VŠECH OSTATNÍCH PŘÍPADECH (a to včetně mikro-posunů myší během PANNINGU na CPU)
  // SE NEPŘEKRESLUJE ANI JEDNA JEDINÁ ČÁRA!
  return true;
});
