// Shared map configuration for consistent sizing across all views

export const BASE_W = 1000;
export const BASE_H = 500;
export const FRAME = 6; // Thinner blue border
export const FRAME_COLOR = "#5b8cff";

export function calculateMapDimensions(vw: number, vh: number) {
  const isPortrait = vh > vw;

  // Use the smaller of innerHeight and visualViewport height to handle
  // mobile browser chrome (omnibox/toolbar) that shrinks the viewport.
  const safeVh = typeof window !== "undefined" && window.visualViewport
    ? Math.min(vh, window.visualViewport.height)
    : vh;

  // Aggressive sizing for better map visibility
  const maxW = vw * (isPortrait ? 0.95 : 0.95);
  const maxH = safeVh * (isPortrait ? 0.68 : 0.80);

  // Better aspect ratio for portrait mode (taller map)
  const ar = isPortrait ? 1.3 : (BASE_W / BASE_H);

  let width = maxW;
  let height = width / ar;
  if (height > maxH) {
    height = maxH;
    width = height * ar;
  }

  return { width, height };
}
