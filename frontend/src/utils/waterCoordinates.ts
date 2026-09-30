import { PortDefinition } from '../data/mockData';
import { point, polygon } from '@turf/helpers';
import type { Feature, Polygon } from 'geojson';
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
    [80.295, 13.060],
    [80.350, 13.060],
    [80.350, 13.130],
    [80.295, 13.130],
    [80.295, 13.060]
  ]],
  // Mumbai Harbor (East of Mumbai island)
  'mumbai': [[
    [72.855, 18.890],
    [72.930, 18.890],
    [72.930, 18.960],
    [72.865, 18.960],
    [72.855, 18.890]
  ]],
  // Kolkata (Hooghly river channel fairway)
  'kolkata': [[
    [88.270, 22.495],
    [88.295, 22.515],
    [88.310, 22.530],
    [88.322, 22.555],
    [88.310, 22.565],
    [88.298, 22.540],
    [88.285, 22.525],
    [88.265, 22.505],
    [88.270, 22.495]
  ]],
  // Paradip (East/Southeast in Bay of Bengal)
  'paradip': [[
    [86.690, 20.230],
    [86.760, 20.230],
    [86.760, 20.300],
    [86.690, 20.300],
    [86.690, 20.230]
  ]],
  // Kochi (Channel & outer harbor entrance)
  'kochi': [[
    [76.160, 9.930],
    [76.245, 9.930],
    [76.245, 10.000],
    [76.160, 10.000],
    [76.160, 9.930]
  ]],
  // Jawaharlal Nehru Port (Water channel west of JNPT berths in Thane Creek)
  'jawaharlal-nehru': [[
    [72.880, 18.910],
    [72.935, 18.910],
    [72.935, 18.960],
    [72.880, 18.960],
    [72.880, 18.910]
  ]],
  // Visakhapatnam (East of port in Bay of Bengal)
  'visakhapatnam': [[
    [83.285, 17.650],
    [83.350, 17.650],
    [83.350, 17.730],
    [83.285, 17.650]
  ]],
  // Thunder Bay (Lake Huron open water south of peninsula)
  'thunder-bay': [[
    [-83.420, 45.000],
    [-83.250, 45.000],
    [-83.250, 45.090],
    [-83.320, 45.055],
    [-83.420, 45.050],
    [-83.420, 45.000]
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
