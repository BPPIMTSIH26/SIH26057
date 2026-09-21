import { PORTS } from '../src/data/mockData.js';
import { generateWaterCoordinates, isConfiguredWaterCoordinate, portWaterPolygons } from '../src/utils/waterCoordinates.js';

function checkCollinearity(coords: {latitude: number, longitude: number}[]) {
  if (coords.length < 3) return false;
  
  // Calculate Pearson correlation to check for strict linearity
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  const n = coords.length;
  
  for (let i = 0; i < n; i++) {
    const x = coords[i].longitude;
    const y = coords[i].latitude;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }
  
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (denominator === 0) return true; // All points same X or Y
  
  const correlation = (n * sumXY - sumX * sumY) / denominator;
  
  // If absolute correlation is > 0.999, they are collinear
  return Math.abs(correlation) > 0.999;
}

function runTests() {
  console.log("Starting Water Coordinate Generation Tests...");
  let allPassed = true;
  
  for (const portId of Object.keys(portWaterPolygons)) {
    const port = PORTS[portId];
    if (!port) {
      console.warn(`WARNING: Port ${portId} has polygons but no mockData definition. Skipping.`);
      continue;
    }
    
    console.log(`Testing ${port.name} (${port.id})...`);
    
    // Generate 1000 points
    const points = generateWaterCoordinates(port, 1000);
    
    // Test 1: Count
    if (points.length !== 1000) {
      console.error(`  [FAILED] Expected 1000 points, got ${points.length}`);
      allPassed = false;
    }
    
    // Test 2: In Water Bounds
    let outOfBounds = 0;
    for (const pt of points) {
      if (!isConfiguredWaterCoordinate(port, pt)) {
        outOfBounds++;
      }
    }
    if (outOfBounds > 0) {
      console.error(`  [FAILED] ${outOfBounds} points generated outside water polygon for ${port.id}`);
      allPassed = false;
    } else {
      console.log(`  [PASSED] All 1000 points strictly inside water polygons.`);
    }
    
    // Test 3: Non-collinearity (Scattered 2D distribution)
    const isCollinear = checkCollinearity(points);
    if (isCollinear) {
      console.error(`  [FAILED] Points for ${port.id} form a collinear distribution (1D line). Must be scattered 2D.`);
      allPassed = false;
    } else {
      console.log(`  [PASSED] Points exhibit scattered 2D distribution (not collinear).`);
    }
    
    // Test 4: Uniqueness (Ensure points aren't just duplicating)
    const uniquePoints = new Set(points.map(p => `${p.latitude},${p.longitude}`));
    if (uniquePoints.size < 900) {
      console.error(`  [FAILED] Not enough unique points. Expected >900, got ${uniquePoints.size}`);
      allPassed = false;
    } else {
      console.log(`  [PASSED] ${uniquePoints.size}/1000 unique points generated.`);
    }
  }
  
  if (allPassed) {
    console.log("\nALL WATER COORDINATE TESTS PASSED!");
    process.exit(0);
  } else {
    console.error("\nSOME WATER COORDINATE TESTS FAILED.");
    process.exit(1);
  }
}

runTests();
