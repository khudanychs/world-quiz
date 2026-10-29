export type GeoPoint = {
  lat: number;
  lng: number;
};

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Haversine Formula: Great-circle distance between two points on Earth's surface
 * Returns distance in kilometers
 */
export function haversineDistanceKm(from: GeoPoint, to: GeoPoint): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);

  const fromLatRad = toRadians(from.lat);
  const toLatRad = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function bearingDegrees(from: GeoPoint, to: GeoPoint): number {
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const dLng = toRadians(to.lng - from.lng);

  const y = Math.sin(dLng) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

export function bearingToCompassEmoji(bearing: number): string {
  const normalized = ((bearing % 360) + 360) % 360;

  if (normalized >= 337.5 || normalized < 22.5) return "⬆️";
  if (normalized >= 22.5 && normalized < 67.5) return "↗️";
  if (normalized >= 67.5 && normalized < 112.5) return "➡️";
  if (normalized >= 112.5 && normalized < 157.5) return "↘️";
  if (normalized >= 157.5 && normalized < 202.5) return "⬇️";
  if (normalized >= 202.5 && normalized < 247.5) return "↙️";
  if (normalized >= 247.5 && normalized < 292.5) return "⬅️";
  return "↖️";
}

export function directionEmoji(from: GeoPoint, to: GeoPoint): string {
  if (Math.abs(from.lat - to.lat) < 1e-5 && Math.abs(from.lng - to.lng) < 1e-5) {
    return "✅";
  }
  return bearingToCompassEmoji(bearingDegrees(from, to));
}

/**
 * Compare guess to target value, returns directional hint emoji
 */
export function compareHintEmoji(
  guessedValue: number | null | undefined,
  targetValue: number | null | undefined
): string {
  if (
    guessedValue === null ||
    guessedValue === undefined ||
    targetValue === null ||
    targetValue === undefined ||
    !Number.isFinite(guessedValue) ||
    !Number.isFinite(targetValue)
  ) {
    return "❔";
  }

  if (targetValue > guessedValue) return "⬆️";
  if (targetValue < guessedValue) return "⬇️";
  return "✅";
}
