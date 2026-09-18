export interface GraticuleBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export const generateGraticule = (
  step: number = 0.05,
  formatLat?: (l: number) => string,
  formatLng?: (l: number) => string,
  bounds?: GraticuleBounds
) => {
  const features = [];
  const minLat = bounds ? Math.max(-90, bounds.minLat) : -90;
  const maxLat = bounds ? Math.min(90, bounds.maxLat) : 90;
  const minLng = bounds ? Math.max(-180, bounds.minLng) : -180;
  const maxLng = bounds ? Math.min(180, bounds.maxLng) : 180;

  // Prevent browser & MapLibre placement engine crash if global bounds with tiny step
  const effectiveStep = (!bounds && step < 0.5) ? 0.5 : Math.max(0.005, step);

  // Latitudes (Horizontal lines)
  for (let lat = minLat; lat <= maxLat; lat += effectiveStep) {
    features.push({
      type: 'Feature' as const,
      geometry: { type: 'LineString' as const, coordinates: [[minLng, lat], [maxLng, lat]] },
      properties: { label: formatLat ? formatLat(lat) : `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`, type: 'latitude' }
    });
  }

  // Longitudes (Vertical lines)
  for (let lng = minLng; lng <= maxLng; lng += effectiveStep) {
    features.push({
      type: 'Feature' as const,
      geometry: { type: 'LineString' as const, coordinates: [[lng, minLat], [lng, maxLat]] },
      properties: { label: formatLng ? formatLng(lng) : `${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : 'W'}`, type: 'longitude' }
    });
  }

  return {
    type: 'FeatureCollection' as const,
    features
  };
};
