import type { PhysicalFeature } from "../../utils/physicalFeatures";
import type { PhysicalGeoMode } from "./modes/types";
import { getGeoFeatureFocus, type GeoFeature, type GeoFeatureKind } from "./geo";

export function calculateZoomForExtent(extent: number): number {
  if (extent >= 40) return 1.2;
  if (extent >= 25) return 1.6;
  if (extent >= 15) return 2.0;
  if (extent >= 10) return 2.5;
  if (extent >= 6) return 3.0;
  if (extent >= 3) return 4.0;
  if (extent >= 1.5) return 5.5;
  return 7.0;
}

export function panToFeature(
  feature: PhysicalFeature,
  activeMode: PhysicalGeoMode,
  getGeoFeature: (name: string, kind?: GeoFeatureKind) => GeoFeature | null
): { coordinates: [number, number]; zoom: number } | null {
  const geometryKind = activeMode.getGeoFeatureKind(feature);

  if (geometryKind) {
    const geoFocus = getGeoFeatureFocus(getGeoFeature(feature.name, geometryKind));
    if (geoFocus) {
      const zoom = calculateZoomForExtent(geoFocus.extent);
      return { coordinates: geoFocus.center, zoom };
    }
  }

  let center: [number, number];
  let extent: number;

  if (feature.shape.kind === "marker") {
    center = feature.shape.center;
    extent = 1;
  } else if (feature.shape.kind === "ellipse") {
    center = feature.shape.center;
    extent = Math.max(feature.shape.rx, feature.shape.ry);
  } else if (feature.shape.kind === "polygon") {
    const points = feature.shape.points;
    const lons = points.map(p => p[0]);
    const lats = points.map(p => p[1]);
    center = [
      (Math.min(...lons) + Math.max(...lons)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ];
    extent = Math.max(
      Math.max(...lons) - Math.min(...lons),
      Math.max(...lats) - Math.min(...lats),
    );
  } else if (feature.shape.kind === "polygon_collection") {
    const allPoints = feature.shape.polygons.flat();
    const lons = allPoints.map((p) => p[0]);
    const lats = allPoints.map((p) => p[1]);
    center = [
      (Math.min(...lons) + Math.max(...lons)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ];
    extent = Math.max(
      Math.max(...lons) - Math.min(...lons),
      Math.max(...lats) - Math.min(...lats),
    );
  } else if (feature.shape.kind === "path") {
    const points = feature.shape.points;
    const midIdx = Math.floor(points.length / 2);
    center = points[midIdx];
    const lons = points.map(p => p[0]);
    const lats = points.map(p => p[1]);
    extent = Math.max(
      Math.max(...lons) - Math.min(...lons),
      Math.max(...lats) - Math.min(...lats),
    );
  } else {
    return null;
  }

  const zoom = calculateZoomForExtent(extent);
  return { coordinates: center, zoom };
}
