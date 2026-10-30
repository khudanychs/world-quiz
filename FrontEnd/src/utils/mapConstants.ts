// Shared map configuration for consistent sizing across all views

export const BASE_W = 1000;
export const BASE_H = 500;
export const FRAME = 6; // Thinner blue border
export const FRAME_COLOR = "#5b8cff";

export function calculateMapDimensions(vw: number, vh: number) {
  const isPortrait = vh > vw;

  // In portrait mode, use visualViewport height if available to handle mobile browser chrome.
  // In mobile landscape (vh <= 480, e.g. Samsung A55 800x360), browser chrome (omnibox/URL bar)
  // frequently collapses and expands. Sizing aggressively down to visualViewport height
  // squashes the map into an unplayable miniature slit. Instead, size against full screen
  // viewport height (vh) so the map remains large, clear, and playable, with page scrolling
  // (overflow-y: auto) handling any temporary browser chrome encroachment.
  const isMobileLandscape = !isPortrait && vh <= 480;
  const effectiveVh = isMobileLandscape
    ? vh
    : (typeof window !== "undefined" && window.visualViewport
        ? Math.min(vh, window.visualViewport.height)
        : vh);

  const landscapeMaxHMultiplier = isMobileLandscape ? 0.90 : 0.80;
  const maxW = vw * 0.95;
  const maxH = effectiveVh * (isPortrait ? 0.68 : landscapeMaxHMultiplier);

  // Better aspect ratio for portrait mode (taller map)
  const ar = isPortrait ? 1.3 : (BASE_W / BASE_H);

  let width = maxW;
  let height = width / ar;
  if (height > maxH) {
    height = maxH;
    width = height * ar;
  }

  // Ensure minimum playable dimensions on mobile landscape so the map is never a tiny slit
  if (isMobileLandscape) {
    const minH = Math.min(280, Math.round(vw * 0.45));
    if (height < minH) {
      height = minH;
      width = Math.min(maxW, Math.round(height * ar));
    }
  }

  return { width, height };
}
