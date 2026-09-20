export interface Point {
  latitude?: number | null;
  longitude?: number | null;
}

export interface HarbourConfig {
  lat: number;
  lng: number;
  waterCenter?: { lat: number; lng: number };
  spread?: number;
  vessel?: string;
}

/**
 * Calculates a balanced center and zoom level so that both the harbour port
 * and the target water point/anomaly are comfortably framed in the viewport.
 */
export function getHarbourViewport(
  harbour: HarbourConfig,
  targetPoint?: Point | null
) {
  const water = (targetPoint && typeof targetPoint.latitude === 'number' && typeof targetPoint.longitude === 'number')
    ? { lat: targetPoint.latitude, lng: targetPoint.longitude }
    : (harbour.waterCenter || { lat: harbour.lat, lng: harbour.lng });

  const midLng = (harbour.lng + water.lng) / 2;
  const midLat = (harbour.lat + water.lat) / 2;

  const spanLng = Math.abs(harbour.lng - water.lng);
  const spanLat = Math.abs(harbour.lat - water.lat);
  const maxSpan = Math.max(spanLng, spanLat);

  let zoom = 11.0;
  if (maxSpan > 0.8) zoom = 8.6;
  else if (maxSpan > 0.35) zoom = 9.8;
  else if (maxSpan > 0.15) zoom = 10.6;
  else zoom = 11.2;

  return {
    longitude: midLng,
    latitude: midLat,
    zoom
  };
}

/**
 * Smoothly fits the map view to contain both the harbour port and all provided
 * points or the selected anomaly, ensuring both remain visible simultaneously.
 */
export function fitMapToHarbourAndPoints(
  map: any,
  harbour: HarbourConfig,
  points: Point[] | Point | null | undefined,
  options?: { padding?: number; maxZoom?: number; duration?: number }
) {
  if (!map || !harbour) return;

  const pts: Point[] = Array.isArray(points)
    ? points
    : points
      ? [points]
      : harbour.waterCenter
        ? [{ latitude: harbour.waterCenter.lat, longitude: harbour.waterCenter.lng }]
        : [];

  let minLng = harbour.lng;
  let maxLng = harbour.lng;
  let minLat = harbour.lat;
  let maxLat = harbour.lat;

  pts.forEach(p => {
    if (typeof p.longitude === 'number' && typeof p.latitude === 'number') {
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
    }
  });

  const dLng = Math.max(maxLng - minLng, 0.04);
  const dLat = Math.max(maxLat - minLat, 0.04);

  // Safety bounding box with 15% margin around the extrema
  const bounds: [[number, number], [number, number]] = [
    [minLng - dLng * 0.15, minLat - dLat * 0.15],
    [maxLng + dLng * 0.15, maxLat + dLat * 0.15]
  ];

  try {
    map.fitBounds(bounds, {
      padding: options?.padding ?? 70,
      maxZoom: options?.maxZoom ?? 11.6,
      duration: options?.duration ?? 400,
      essential: true
    });
  } catch (_err) {
    const validPt = pts.find(p => typeof p.latitude === 'number' && typeof p.longitude === 'number');
    const vp = getHarbourViewport(harbour, validPt);
    map.flyTo({
      center: [vp.longitude, vp.latitude],
      zoom: options?.maxZoom ?? vp.zoom,
      duration: options?.duration ?? 400,
      essential: true
    });
  }
}
