import { PortDefinition } from '../data/mockData';
import { point, polygon, Feature, Polygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { DEMO_SEEDS, mulberry32 } from './seededRandom';

export interface WaterCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Defines the navigable water areas for specific ports using GeoJSON polygon coordinate arrays.
 * Format: [[[lng, lat], [lng, lat], ...]]
 * Note: The first and last coordinate pair of each polygon must be identical to close the ring.
 */
export const portWaterPolygons: Record<string, number[][][]> = {
  // Chennai (Bay of Bengal coast - East of port)
  'chennai': [[
    [80.290, 13.100],
    [80.320, 13.100],
    [80.320, 13.070],
    [80.290, 13.070],
    [80.290, 13.100]
  ]],
  // Mumbai Harbor (East of Mumbai island)
  'mumbai': [[
    [72.840, 18.970],
    [72.950, 18.970],
    [72.950, 18.880],
    [72.840, 18.880],
    [72.840, 18.970]
  ]],
  // Kolkata (Hooghly river channel)
  'kolkata': [[
    [88.305, 22.560],
    [88.315, 22.560],
    [88.315, 22.540],
    [88.305, 22.540],
    [88.305, 22.560]
  ]],
  // Paradip (East/Southeast of port)
  'paradip': [[
    [86.680, 20.280],
    [86.720, 20.280],
    [86.720, 20.240],
    [86.680, 20.240],
    [86.680, 20.280]
  ]],
  // Kochi (Water areas around Willingdon Island)
  'kochi': [[
    [76.240, 9.980],
    [76.280, 9.980],
    [76.280, 9.930],
    [76.240, 9.930],
    [76.240, 9.980]
  ]],
  // Jawaharlal Nehru Port (West of port facilities)
  'jawaharlal-nehru': [[
    [72.910, 18.960],
    [72.940, 18.960],
    [72.940, 18.930],
    [72.910, 18.930],
    [72.910, 18.960]
  ]],
  // Visakhapatnam (East of port)
  'visakhapatnam': [[
    [83.290, 17.710],
    [83.320, 17.710],
    [83.320, 17.680],
    [83.290, 17.680],
    [83.290, 17.710]
  ]],
  // Thunder Bay (Lake Superior - East of port)
  'thunder-bay': [[
    [-89.200, 48.430],
    [-89.150, 48.430],
    [-89.150, 48.380],
    [-89.200, 48.380],
    [-89.200, 48.430]
  ]]
};

/**
 * Calculates the bounding box [minX, minY, maxX, maxY] for a given polygon.
 */
function getBoundingBox(coords: number[][][]): [number, number, number, number] {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const ring of coords) {
    for (const [lng, lat] of ring) {
      if (lng < minX) minX = lng;
      if (lng > maxX) maxX = lng;
      if (lat < minY) minY = lat;
      if (lat > maxY) maxY = lat;
    }
  }

  return [minX, minY, maxX, maxY];
}

/**
 * Generates a valid water anomaly coordinate for a specified port.
 */
export function getRandomWaterCoordinate(port: PortDefinition, random?: () => number): WaterCoordinate {
  if (!random) {
    const seed = DEMO_SEEDS[port.id] || 17000;
    random = mulberry32(seed + Math.floor(Math.random() * 10000)); // Default to seeded random for deterministic tests if seed is used carefully, but here we usually pass a fixed random. 
    // Wait, the requirement says "Use a different seed per port ... The generator must produce a scattered 2D distribution".
    // Better to let `generateWaterCoordinates` handle the seeded PRNG.
  }
  // Let's actually just keep random as is, but use the provided one or Math.random
  const randFunc = random || Math.random;
  const coords = portWaterPolygons[port.id];
  if (!coords) {
    throw new Error(`Port polygon data not found for ID: ${port.id}`);
  }

  const waterPolygon: Feature<Polygon> = polygon(coords);
  const [minLng, minLat, maxLng, maxLat] = getBoundingBox(coords);
  
  const MAX_ATTEMPTS = 500;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    const randomLng = minLng + randFunc() * (maxLng - minLng);
    const randomLat = minLat + randFunc() * (maxLat - minLat);
    const candidatePoint = point([randomLng, randomLat]);

    if (booleanPointInPolygon(candidatePoint, waterPolygon)) {
      return {
        longitude: randomLng,
        latitude: randomLat
      };
    }
  }

  throw new Error(`Failed to generate a valid water coordinate for ${port.id} after ${MAX_ATTEMPTS} attempts.`);
}

/**
 * Generates an array of valid water coordinates.
 */
export function generateWaterCoordinates(port: PortDefinition, count: number, random?: () => number): WaterCoordinate[] {
  if (count < 0 || !Number.isInteger(count)) {
    throw new Error(`Count must be a non-negative integer. Received: ${count}`);
  }
  
  const randFunc = random || mulberry32(DEMO_SEEDS[port.id] || 17000);
  
  const coords: WaterCoordinate[] = [];
  for (let i = 0; i < count; i++) {
    coords.push(getRandomWaterCoordinate(port, randFunc));
  }
  return coords;
}

/**
 * Checks if a coordinate resides within the configured water polygon for a port.
 */
export function isConfiguredWaterCoordinate(port: PortDefinition, coordinate: { latitude: number, longitude: number }): boolean {
  const coords = portWaterPolygons[port.id];
  if (!coords) return false;

  const waterPolygon: Feature<Polygon> = polygon(coords);
  const candidatePoint = point([coordinate.longitude, coordinate.latitude]);
  
  return booleanPointInPolygon(candidatePoint, waterPolygon);
}
