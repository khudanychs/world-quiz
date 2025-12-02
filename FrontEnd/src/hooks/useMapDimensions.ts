import { useState, useEffect } from "react";
import { BASE_W, BASE_H, calculateMapDimensions } from "../utils/mapConstants";

/**
 * Custom hook for handling responsive map dimensions.
 * Provides dimensions, portrait detection, and auto-updates on resize.
 */
export function useMapDimensions() {
  const [dimensions, setDimensions] = useState({ width: BASE_W, height: BASE_H });
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setIsPortrait(vh > vw);
      setDimensions(calculateMapDimensions(vw, vh));
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Detect if we're on desktop (width >= 768px)
  const isDesktop = dimensions.width >= 768;

  return { dimensions, isPortrait, isDesktop };
}
