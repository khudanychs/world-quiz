export function getPreferLowDetailTopography(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.location.search.includes("physLowDetail=1") || window.localStorage.getItem("physGeoLowDetail") === "1";
}
