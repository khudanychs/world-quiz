// Shared map configuration for consistent sizing across all views

export const BASE_W = 1000;
export const BASE_H = 500;
export const FRAME = 6; // Thinner blue border
export const FRAME_COLOR = "#5b8cff";

export function calculateMapDimensions(vw: number, vh: number) {
  const isPortrait = vh > vw;
  
  // Aggressive sizing for better map visibility
  const maxW = vw * (isPortrait ? 0.92 : 0.95);
  const maxH = vh * (isPortrait ? 0.55 : 0.80); // Adjusted for portrait UI panel
  
  // Better aspect ratio for portrait mode
  const ar = isPortrait ? 1.5 : (BASE_W / BASE_H);
  
  let width = maxW;
  let height = width / ar;
  if (height > maxH) {
    height = maxH;
    width = height * ar;
  }
  
  return { width, height };
}
