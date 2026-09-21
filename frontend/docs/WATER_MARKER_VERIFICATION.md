# Water Marker Verification

## Overview
This document serves as verification that all mock anomaly coordinate generation has been rectified to only place markers within verified water corridors.

## Changes Made
1. **Backend Generator Updates**: Removed micro-jitter logic (`random.uniform`) from `add_all_port_anomalies.py`. The generation script now uses exact predefined water coordinates.
2. **Frontend Port Data Definition**: Updated `frontend/src/data/mockData.ts` to include `waterCoordinates` arrays containing at least 5 manually verified coordinates for each port.
3. **Frontend Coordinate Selector**: Added `getRandomWaterCoordinate` to `frontend/src/utils/waterCoordinates.ts` which deterministically picks an exact coordinate from the pool.
4. **Image Processing Publish Location**: Refactored `handlePublish` in `ImageProcessing.tsx` to stop using randomized 360-degree radial scattering (`Math.random()`) and instead use `getRandomWaterCoordinate`.

## Test Verification
- Ran test suite using `npx tsx tests/test_water_coordinates.ts`.
- `getRandomWaterCoordinate` verified to return exact locations.
- Attempting to query an unconfigured port throws the appropriate missing pool error.
- Verified that the old `spread` logic in the UI is fully removed from marker placement on the map.

## Manual Verification Status
- [x] Verified **Mumbai Harbor**: Placements remain tightly clustered along the harbor lines, no placements on the city or docks.
- [x] Verified **Chennai Port**: Placements only inside the basin.
- [x] Verified **Kolkata Port**: Placements constrained exclusively to the Hooghly River layout.
- [x] Verified **Jawaharlal Nehru Port**: Placements clear of landmass.

## Conclusion
The issue where anomaly markers were being generated incorrectly on buildings, roads, cities, and other land areas has been completely resolved. All simulated data across the repository respects strict water placement logic.
