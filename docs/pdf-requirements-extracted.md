# S.A.G.A.R. Website Accurate to SIH26057 - PDF Requirements

This document extracts the requirements from the provided SIH26057 build prompt PDF.

## 1. Official problem statement to implement
- **Problem Statement ID:** SIH26057
- **Title:** AI-Powered Automated Underwater Marine Debris and Anomaly Detection System using Side-Scan Sonar Imagery
- **Organization:** Ministry of Earth Sciences / National Institute of Ocean Technology
- **Goal:** Build an end-to-end computer-vision pipeline that ingests side-scan sonar imagery, identifies man-made debris against complex natural backgrounds, and generates actionable localized information.
- **Must address:** speckle noise, varying pixel resolutions, acoustic shadows, sonar data dropouts, underwater vehicle motion, confusion with natural topology, limited cloud dependence.

### Expected solution components
1. **Object detection/semantic segmentation** for man-made objects.
2. **Confidence scoring and noise filtering** (reduces false positives, scores 0-100%).
3. **Anomaly reporting and geotagging** (JSON/CSV with lat, lon, class, dims, confidence, priority).
4. **Operator dashboard** (upload, view map, inspect evidence, compare surveys, review, download reports).

## 2. Existing project context
- **Prototype:** `https://sagar-netra-sandy.vercel.app`
- **Modules:** Auth/roles, Dashboard, Survey upload, Image processing, Baseline/anomaly map, Temporal comparison, Human review, Final report.
- **Team:** Orion, ID: BPPIMTSIH26, Size: 6.
- **Constraint:** Do not include passwords/secrets in code, frontend, seeds, screenshots, or deployment.

## 3. Mandatory first action: scan the current repository
- Create:
  - `docs/current-project-scan.md`
  - `docs/architecture-map.md`
  - `docs/refinement-log.md`
  - `docs/claims-matrix.md`
- Inspect: frontend framework/routes, backend framework/APIs, DB schema, seed data, auth guards, upload routes, model inference paths, preprocessing/postprocessing, geolocation, anomaly scoring/priority, temporal comparison, human review state machine, report generation, HF datasets, metrics/eval scripts, env vars, CI/CD scripts, accessibility, legal pages.
- Classify outputs as: live implementation, repository-backed data, seeded demo data, mock/placeholder, planned, broken, not verified.

## 4. Use existing Hugging Face data and metrics first
- Dataset: `https://huggingface.co/datasets/narayan-nkj/sagar-sss`
- Verify dataset details (5205 tiles, train/val/test splits, YOLO format, 640px, CC-BY-SA-4.0, class names, etc.).
- Import real metrics (precision, recall, mAP) rather than inventing them.
- Create/update: `ml/evaluate.py`, `ml/evaluation_config.yaml`, `ml/reports/latest_metrics.json`, `ml/reports/latest_metrics.md`, `docs/model-card.md`, `docs/dataset-attribution.md`, `docs/limitations.md`.
- *Constraint:* Do not download the full dataset at every startup. Use explicit setup commands.

## 5. Product requirements: Core User Journey
Workflow: login → select port → upload sonar → validate metadata → preprocess → detect → filter → score → attach lat/lon → view on map → compare baseline → human-review → export JSON/CSV.
*Must be obvious within one minute. No generic "AI command centre" language without tying to sonar.*

## 6. Port and anomaly representation
- **6.1 Port catalog:** Show port name, sector, lat/lon, data status, survey count, anomaly count, last survey date, active alerts, review queue count. Prefer Indian sectors (Mumbai, Chennai, Kochi, Vizag, JNPT, Kolkata, Paradip).
- **6.2 More anomalies per port:** Represent ghost net, shipwreck, sub pipeline, mine cylinder, other artificial object, natural formation, low-quality region, known object, unknown anomaly, false-positive, new temporal change. Use real or deterministic seeded data, never fabricate live run data.
  - Anomaly properties: alert ID, port, lat/lon, class, confidence (0-100%), criticality/priority, bounding box, evidence crop, source ID, timestamp, DEMO/LIVE badge, review status, priority reason.
- **6.3 Port UI:** Add selectors, filters (category, confidence, priority, review-status), map markers/clusters, sortable list, summary panel, export button.

## 7. Raw sonar upload and image upload
- **7.1 Raw Survey Mode:** `.sl2`, `.xtf`, `.json`. Collect survey name, vessel, port, date, depth, baseline ref, coords, metadata.
- **7.2 Image Tile Mode:** PNG, JPG, TIFF. Collect dims, survey ID, coords, resolution, preprocessing status.
- **7.3 Conversion path UI:** `raw log → decoded swath → motion/quality correction → tile extraction → model inference`.
- **7.4 Validation:** check extension, MIME, max size, decompression, dims, malformed files, checksums, missing metadata, low quality, heave/pitch/roll, dropouts, speckle score. Safe fallback if motion correction missing.

## 8. Real processing pipeline
- If claiming 14 stages, preserve only if they exist in code, otherwise implement missing or fix UI claim.
- Stages (example): file validation, metadata extraction, decoding, quality assess, motion assess, speckle filtering, CLAHE, norm/resolution, tiling, detection, NMS, shadow/natural verify, geolocation, confidence/priority/report.
- Show for each stage: status, input/output, duration, implementation source, error state, reproducibility.
- Provide a processing receipt.

## 9. Detection, filtering, confidence, reporting
- Provide for each anomaly: class, ID, bbox/mask, confidence, natural-formation score, verification evidence, coords, dims, temporal score, criticality, priority reason, source run, review status.
- Filter against: rock clusters, seabed ridges, shadows, speckle, dropouts, low-res, motion artefacts.
- Route uncertain categories to human review.
- Export JSON/CSV matching the schema.

## 10. Temporal comparison and human review
- **10.1 Temporal:** baseline, previous, current surveys. Synchronized tiles, changed-region visualization, spatial/temporal deviation scores, first-observed date, AI explanation, provenance. No hard-coded static metrics.
- **10.2 Human review:** State machine: `pending → confirmed_unknown | known_object | false_positive | new_class`. Persist ID, reviewer, decision, notes, timestamp, crop, model, dataset. Handle empty states professionally.

## 11. Privacy, legal, trust, accessibility
- **11.1 Privacy:** Add `/privacy-policy`, explain data collection, retention, deletion, security limits. No real user data collection.
- **11.2 Terms:** `/terms-of-use`, `/data-use-and-attribution`, `/contact`. Note prototype status, no safety guarantees, dataset attribution.
- **11.3 Accessibility:** `/accessibility`. Keyboard nav, focus states, accessible names, contrast, form labels, reduced-motion, screen-reader text, responsive laptop/projector layout. Add `/health` or `/system-status`.

## 12. Demo mode and build readiness
- Add npm scripts: `npm run demo:setup`, `npm run demo:reset`, `npm run verify:demo`, `npm run build`, `npm run healthcheck`.
- Clean evaluator steps: install, configure env, start app, load demo data, run sample, inspect ports, review alert, download report, run tests, build.
- No hidden manual edits or massive downloads on startup.
- System-status page with OK/DEGRADED/UNAVAILABLE.

## 13. Security requirements
- Rotate public credentials, hash passwords, no frontend secrets, role-based auth, rate limits, input validation, path traversal protection, no private survey logging, CORS/security headers, secret scanning, session timeouts.

## 14. UI copy rules
- Remove/qualify: "100% Coverage Area", "<0.5s Detection Latency", "Zero-Shot Open-World Anomaly Detection", "Multi-Modal Verification", "Proven AI + SONAR Pipeline", "National Platform", "Real-Time" (unless benchmarked), "Research shows".
- Labels: RESULT, TARGET, DEMO DATA, LIVE RUN, PLANNED, NOT MEASURED.
- Metric sources must be explicit.

## 15. Evaluation and claims matrix
- `docs/claims-matrix.md`. Report precision, recall, mAP, confusion matrix, false-alert rate, latency, review-time. Separate real and synthetic. Add ablations.

## 16. Testing requirements
- Tests for: login, roles, session, upload (raw/tile, invalid, oversized), metadata, quality, demo reset, live processing, pipeline retry, multiple anomalies, filters, temporal, missing baseline, review persistence, report export, privacy pages, health checks, accessibility, no secrets, reproducible metrics.
- `npm run verify:demo` must pass.

## 17. Required documentation
- See section 3 for docs to create.
- README must include: local setup, deploy setup, demo setup, model/dataset config, HF revision, supported formats, privacy behavior, metrics repro, limitations, attribution, jury demo path, health commands.

## 18. Required final output from the IDE
- Complete repository scan, architecture map, changed-file list, features preserved, weak points fixed, HF config used, metrics generated, privacy pages added, port data model, demo instructions, test results, build results, environment vars, limitations, PPT claims.

## 19. Definition of done
- Scanned repo, working features preserved, directly solves MoES/NIOT, accepts sonar inputs, addresses noise honestly, detects anomalies using real model, outputs correct fields, multiple demo anomalies per port with DEMO DATA badge, integrated maps/review/reports, CSV/JSON works, legal pages exist, HF configured, no false claims, no secrets, `npm run build` and `verify:demo` pass. Final PPT matches claims.
