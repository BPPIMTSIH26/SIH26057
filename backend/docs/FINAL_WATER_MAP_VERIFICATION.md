# Final Water Map & Anomaly Distribution Verification

## Objective
Verify that S.A.G.A.R. Command's anomaly generation logic places markers explicitly in water and follows a naturally scattered 2D distribution instead of collinear, linear, or heavily centralized clusters. Furthermore, verify the successful relocation of the Hugging Face S.A.G.A.R dataset to a tracked internal folder.

## Validations Performed

1. **2D Water Polygon Rejection Sampling**
   - The frontend's `getRandomWaterCoordinate` function in `waterCoordinates.ts` has been upgraded to perform ray-casting point-in-polygon checks via Turf.js.
   - It uniformly generates candidate coordinates across the bounding box of a port's water polygon and explicitly rejects any that land on shore.

2. **Backend Seed Synchronization**
   - `backend/utils/water_coordinates.py` now replicates the same polygon geometries as the frontend.
   - The backend seeding script (`seed_data.py`) has been upgraded from "center + jitter" logic to use a matching 2D rejection-sampling algorithm.

3. **Deterministic Scattering & Collinearity Test**
   - We implemented a seeded Pseudo-Random Number Generator (Mulberry32) to ensure consistent port mock data.
   - `frontend/tests/test_water_coordinates.ts` was executed to generate 1,000 points per port.
   - Pearson correlation coefficients confirmed that the coordinates are non-collinear (i.e. they do not form a strict 1D line like a channel centerline), passing with a correlation magnitude significantly below 0.999.
   - Uniqueness was validated, ensuring > 90% of generated points are unique coordinates.

4. **Database Repair**
   - We executed `backend/scripts/repair_demo_coordinates.py`.
   - 40 anomalies across the 8 mock ports were safely re-calculated to sit perfectly within the new water polygons.
   - Database entries (both `Detection` and `Anomaly` tables) were successfully committed with their repaired coordinates.

5. **Dataset Handling & Git LFS**
   - The Hugging Face S.A.G.A.R dataset has been fully migrated from `/tmp` into `backend/HG_DATA/`.
   - `.gitattributes` has been added at the root level to track these large dataset files (jpg, png, txt, yaml) securely via Git Large File Storage (LFS) avoiding regular Git repository limits.

## Conclusion
The pipeline properly respects geospatial constraints, correctly isolating generated anomalies to valid water sectors with realistic 2D scattering. The system is ready for the final GitHub push and subsequent frontend deployment.
