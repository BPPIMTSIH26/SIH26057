export type AnomalyClassification = "unknown" | "known" | "false_positive";
export type AnomalySeverity = "normal" | "unusual" | "high";
export type ReviewStatus = "pending" | "confirmed_unknown" | "known_object" | "false_positive";

export interface Survey {
  id: string;
  name: string;
  vessel: string;
  area: string;
  surveyDate: string;
  depthRange: string;
  status: "ready" | "processing" | "complete";
}

export interface Anomaly {
  id: string;
  portId: string;
  portName?: string;
  label: string;
  classification: AnomalyClassification;
  severity: AnomalySeverity;
  reviewStatus: ReviewStatus;
  overallScore: number;
  spatialDeviationScore: number;
  temporalChangeScore: number;
  confidence: number;
  latitude: number | null;
  longitude: number | null;
  depthMeters: number | null;
  detectedAt: string;
  firstObserved: string;
  explanation: string;
  sonarImage: string;
  priority: "low" | "medium" | "high" | "immediate";
  notes?: string;
  customClassName?: string;
  locationSource?: string;
  modelVersion?: string;
  datasetVersion?: string;
}

export interface ModelFeedback {
  currentModel: { name: string; accuracy: number; lastUpdated?: string };
  feedbackSamples: number;
  potentialRetrainingSet: number;
  nextModel: { name: string; accuracy: number; estimatedTime?: string };
}

export interface DashboardMetrics {
  normalRegions: number;
  knownAnomalies: number;
  unknownAnomalies: number;
  newChanges: number;
}

export interface ReportSummary {
  surveyCoverage: string;
  normalRegions: number;
  knownAnomalies: number;
  unknownAnomalies: number;
  newChanges: number;
}

export interface TemporalPoint {
  date: string;
  score: number;
}

export interface ProcessingJob {
  status: "complete";
  anomaliesCount: number;
}

export interface AnomalyFilters {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export interface ReviewDecision {
  status: ReviewStatus;
  notes?: string;
  newClass?: string;
}

export interface PortDefinition {
  /** Unique identifier for the port */
  id: string;
  /** Human‑readable name */
  name: string;
  /** Short code used in UI */
  code: string;
  /** Latitude of the port center */
  lat: number;
  /** Longitude of the port center */
  lng: number;
  /** Central water point for anomaly generation */
  waterCenter: { lat: number; lng: number };
  /** Sampling spread radius (decimal degrees) */
  spread: number;
  /** Known water‑only coordinates forming a corridor */
  waterCoordinates?: Array<{ latitude: number; longitude: number }>;
  /** Representative vessel name for demo data */
  vessel: string;
  /** Approximate land area of the port district (km²) */
  areaSqKm?: number;
  /** Maximum navigable depth at the port (meters) */
  maxDepthMeters?: number;
  /** Annual cargo throughput (in 10⁴ TEU) – illustrative */
  annualThroughputTEU?: number;
  /** Governing port authority */
  authority?: string;
}

/**
 * ═══════════════════════════════════════════════════════════════
 *  PORT REGISTRY – S.A.G.A.R. Command
 * ═══════════════════════════════════════════════════════════════
 *
 *  Each port carries operational metadata consumed by the
 *  Dashboard "Port Intel" card, the MapWorkspace popup, and
 *  the anomaly generation / seeding pipeline.
 *
 *  WHY THESE NUMBERS?
 *  ──────────────────
 *  • areaSqKm        – Approximate navigable water area surveyed
 *                       around the port (km²). Derived from the
 *                       bounding polygon in waterCoordinates.ts.
 *                       Larger areas need more scan time and may
 *                       hold more anomalies.
 *
 *  • maxDepthMeters   – Deepest navigable draft or anchorage
 *                       depth reported by the port authority.
 *                       Affects sonar range and detection
 *                       confidence: shallower ports give stronger
 *                       backscatter (higher confidence), while
 *                       deeper water weakens returns.
 *
 *  • annualThroughputTEU – Approximate container throughput per
 *                       year (in units of 10,000 TEU).  Higher
 *                       throughput → more vessel traffic → greater
 *                       risk of dropped objects / debris creating
 *                       anomalies.  JNPT is India's busiest
 *                       container port, hence the highest value.
 *
 *  • authority        – Governing port trust or authority.
 *                       Displayed in the UI for jurisdictional
 *                       context when generating reports.
 *
 *  • waterCoordinates – 16 hand‑picked GPS points confirmed to
 *                       be over open water.  These seed the
 *                       rejection‑sampling polygon; more points
 *                       = better spatial scatter of mock anomalies.
 *
 *  All numerical values are approximate and intended for demo /
 *  SIH 2026 presentation purposes.
 * ═══════════════════════════════════════════════════════════════
 */
export const PORTS: Record<string, PortDefinition> = {
  'mumbai': {
    id: 'mumbai', name: 'Mumbai Harbor Q3', code: 'MUM',
    lat: 18.9387, lng: 72.8353,
    waterCenter: { lat: 18.9387, lng: 72.8353 }, spread: 0.04,
    vessel: 'R/V Samudra',
    areaSqKm: 28,
    maxDepthMeters: 14,
    annualThroughputTEU: 200,
    authority: 'Mumbai Port Authority',
    waterCoordinates: [
      { latitude: 18.9100, longitude: 72.8600 }, { latitude: 18.9180, longitude: 72.8700 },
      { latitude: 18.9250, longitude: 72.8820 }, { latitude: 18.9320, longitude: 72.8950 },
      { latitude: 18.9400, longitude: 72.9050 }, { latitude: 18.9470, longitude: 72.9150 },
      { latitude: 18.9150, longitude: 72.8750 }, { latitude: 18.9220, longitude: 72.9000 },
      { latitude: 18.9050, longitude: 72.8650 }, { latitude: 18.9350, longitude: 72.8880 },
      { latitude: 18.9420, longitude: 72.9100 }, { latitude: 18.9280, longitude: 72.8780 },
      { latitude: 18.9130, longitude: 72.8680 }, { latitude: 18.9380, longitude: 72.9020 },
      { latitude: 18.9200, longitude: 72.8900 }, { latitude: 18.9500, longitude: 72.9200 }
    ]
  },
  'chennai': {
    id: 'chennai', name: 'Chennai Port', code: 'CHE',
    lat: 13.0827, lng: 80.2707,
    waterCenter: { lat: 13.0827, lng: 80.2707 }, spread: 0.04,
    vessel: 'R/V Sagar Kanya',
    areaSqKm: 24,
    maxDepthMeters: 18,
    annualThroughputTEU: 160,
    authority: 'Chennai Port Authority',
    waterCoordinates: [
      { latitude: 13.0850, longitude: 80.2980 }, { latitude: 13.0920, longitude: 80.3050 },
      { latitude: 13.1000, longitude: 80.3150 }, { latitude: 13.1080, longitude: 80.3250 },
      { latitude: 13.0780, longitude: 80.2960 }, { latitude: 13.1150, longitude: 80.3350 },
      { latitude: 13.1220, longitude: 80.3420 }, { latitude: 13.0650, longitude: 80.2970 },
      { latitude: 13.0880, longitude: 80.3020 }, { latitude: 13.0950, longitude: 80.3100 },
      { latitude: 13.1040, longitude: 80.3200 }, { latitude: 13.0720, longitude: 80.2940 },
      { latitude: 13.0810, longitude: 80.2990 }, { latitude: 13.1100, longitude: 80.3300 },
      { latitude: 13.0690, longitude: 80.2950 }, { latitude: 13.1180, longitude: 80.3380 }
    ]
  },
  'kochi': {
    id: 'kochi', name: 'Kochi Harbor', code: 'KOC',
    lat: 9.9312, lng: 76.2673,
    waterCenter: { lat: 9.9312, lng: 76.2673 }, spread: 0.04,
    vessel: 'R/V Sindhu Sadhana',
    areaSqKm: 15,
    maxDepthMeters: 13,
    annualThroughputTEU: 74,
    authority: 'Cochin Port Authority',
    waterCoordinates: [
      { latitude: 9.9620, longitude: 76.2200 }, { latitude: 9.9700, longitude: 76.2100 },
      { latitude: 9.9780, longitude: 76.1900 }, { latitude: 9.9500, longitude: 76.2350 },
      { latitude: 9.9850, longitude: 76.1800 }, { latitude: 9.9400, longitude: 76.2450 },
      { latitude: 10.000, longitude: 76.1700 }, { latitude: 9.9650, longitude: 76.2280 },
      { latitude: 9.9550, longitude: 76.2320 }, { latitude: 9.9730, longitude: 76.2050 },
      { latitude: 9.9680, longitude: 76.2150 }, { latitude: 9.9450, longitude: 76.2400 },
      { latitude: 9.9900, longitude: 76.1750 }, { latitude: 9.9580, longitude: 76.2250 },
      { latitude: 9.9820, longitude: 76.1850 }, { latitude: 9.9350, longitude: 76.2480 }
    ]
  },
  'visakhapatnam': {
    id: 'visakhapatnam', name: 'Visakhapatnam Port', code: 'VIZ',
    lat: 17.6868, lng: 83.2185,
    waterCenter: { lat: 17.6868, lng: 83.2185 }, spread: 0.04,
    vessel: 'R/V Gaveshani',
    areaSqKm: 21,
    maxDepthMeters: 18.1,
    annualThroughputTEU: 72,
    authority: 'Visakhapatnam Port Authority',
    waterCoordinates: [
      { latitude: 17.6800, longitude: 83.2900 }, { latitude: 17.6900, longitude: 83.3000 },
      { latitude: 17.7000, longitude: 83.3100 }, { latitude: 17.7100, longitude: 83.3200 },
      { latitude: 17.6700, longitude: 83.2850 }, { latitude: 17.7200, longitude: 83.3300 },
      { latitude: 17.6600, longitude: 83.2800 }, { latitude: 17.7150, longitude: 83.3250 },
      { latitude: 17.6850, longitude: 83.2950 }, { latitude: 17.6950, longitude: 83.3050 },
      { latitude: 17.7050, longitude: 83.3150 }, { latitude: 17.6750, longitude: 83.2870 },
      { latitude: 17.6650, longitude: 83.2820 }, { latitude: 17.7120, longitude: 83.3220 },
      { latitude: 17.6880, longitude: 83.2980 }, { latitude: 17.7180, longitude: 83.3280 }
    ]
  },
  'jawaharlal-nehru': {
    id: 'jawaharlal-nehru', name: 'Jawaharlal Nehru Port', code: 'JAW',
    lat: 18.9500, lng: 72.9500,
    waterCenter: { lat: 18.9500, lng: 72.9500 }, spread: 0.04,
    vessel: 'R/V Sagar Nidhi',
    areaSqKm: 30,
    maxDepthMeters: 15,
    annualThroughputTEU: 580,
    authority: 'Jawaharlal Nehru Port Authority',
    waterCoordinates: [
      { latitude: 18.9350, longitude: 72.9450 }, { latitude: 18.9450, longitude: 72.9550 },
      { latitude: 18.9550, longitude: 72.9650 }, { latitude: 18.9650, longitude: 72.9700 },
      { latitude: 18.9250, longitude: 72.9350 }, { latitude: 18.9750, longitude: 72.9720 },
      { latitude: 18.9400, longitude: 72.9500 }, { latitude: 18.9500, longitude: 72.9600 },
      { latitude: 18.9300, longitude: 72.9400 }, { latitude: 18.9600, longitude: 72.9680 },
      { latitude: 18.9480, longitude: 72.9580 }, { latitude: 18.9380, longitude: 72.9480 },
      { latitude: 18.9520, longitude: 72.9620 }, { latitude: 18.9700, longitude: 72.9710 },
      { latitude: 18.9280, longitude: 72.9380 }, { latitude: 18.9580, longitude: 72.9660 }
    ]
  },
  'kolkata': {
    id: 'kolkata', name: 'Kolkata Port', code: 'KOL',
    lat: 22.5314, lng: 88.3225,
    waterCenter: { lat: 22.5314, lng: 88.3225 }, spread: 0.04,
    vessel: 'R/V Sagar Manjusha',
    areaSqKm: 8,
    maxDepthMeters: 8.5,
    annualThroughputTEU: 25,
    authority: 'Syama Prasad Mookerjee Port',
    waterCoordinates: [
      { latitude: 22.5100, longitude: 88.3000 }, { latitude: 22.5200, longitude: 88.3050 },
      { latitude: 22.5300, longitude: 88.3100 }, { latitude: 22.5400, longitude: 88.3050 },
      { latitude: 22.5000, longitude: 88.2950 }, { latitude: 22.5500, longitude: 88.3000 },
      { latitude: 22.5150, longitude: 88.3020 }, { latitude: 22.5250, longitude: 88.3070 },
      { latitude: 22.5050, longitude: 88.2980 }, { latitude: 22.5350, longitude: 88.3080 },
      { latitude: 22.5180, longitude: 88.3040 }, { latitude: 22.5280, longitude: 88.3090 },
      { latitude: 22.5420, longitude: 88.3030 }, { latitude: 22.5080, longitude: 88.2970 },
      { latitude: 22.5220, longitude: 88.3060 }, { latitude: 22.5450, longitude: 88.3010 }
    ]
  },
  'paradip': {
    id: 'paradip', name: 'Paradip Port', code: 'PAR',
    lat: 20.2662, lng: 86.6775,
    waterCenter: { lat: 20.2662, lng: 86.6775 }, spread: 0.04,
    vessel: 'R/V Anveshani',
    areaSqKm: 18,
    maxDepthMeters: 17,
    annualThroughputTEU: 12,
    authority: 'Paradip Port Authority',
    waterCoordinates: [
      { latitude: 20.2600, longitude: 86.7000 }, { latitude: 20.2700, longitude: 86.7200 },
      { latitude: 20.2800, longitude: 86.7400 }, { latitude: 20.2500, longitude: 86.6950 },
      { latitude: 20.2900, longitude: 86.7500 }, { latitude: 20.2650, longitude: 86.7100 },
      { latitude: 20.2750, longitude: 86.7300 }, { latitude: 20.2550, longitude: 86.6970 },
      { latitude: 20.2620, longitude: 86.7050 }, { latitude: 20.2720, longitude: 86.7250 },
      { latitude: 20.2820, longitude: 86.7450 }, { latitude: 20.2520, longitude: 86.6960 },
      { latitude: 20.2680, longitude: 86.7150 }, { latitude: 20.2780, longitude: 86.7350 },
      { latitude: 20.2580, longitude: 86.6990 }, { latitude: 20.2850, longitude: 86.7480 }
    ]
  },
  'thunder-bay': {
    id: 'thunder-bay', name: 'Thunder Bay, Lake Huron', code: 'THU',
    lat: 45.0600, lng: -83.4300,
    waterCenter: { lat: 45.0600, lng: -83.4300 }, spread: 0.04,
    vessel: 'AUV Iver3 (AI4Shipwrecks)',
    areaSqKm: 1148,
    maxDepthMeters: 55,
    annualThroughputTEU: 0,
    authority: 'NOAA Thunder Bay NMS',
    waterCoordinates: [
      { latitude: 45.0400, longitude: -83.4200 }, { latitude: 45.0500, longitude: -83.4000 },
      { latitude: 45.0600, longitude: -83.3800 }, { latitude: 45.0700, longitude: -83.3600 },
      { latitude: 45.0800, longitude: -83.3400 }, { latitude: 45.0900, longitude: -83.3200 },
      { latitude: 45.0350, longitude: -83.4100 }, { latitude: 45.0450, longitude: -83.3900 },
      { latitude: 45.0550, longitude: -83.3850 }, { latitude: 45.0650, longitude: -83.3700 },
      { latitude: 45.0750, longitude: -83.3500 }, { latitude: 45.0850, longitude: -83.3300 },
      { latitude: 45.0380, longitude: -83.4150 }, { latitude: 45.0480, longitude: -83.3950 },
      { latitude: 45.0580, longitude: -83.3750 }, { latitude: 45.0950, longitude: -83.3150 }
    ]
  },
};

export const DEFAULT_PORT_ID = 'mumbai';

export function getPort(idOrName?: string | null): PortDefinition {
  if (!idOrName) return PORTS[DEFAULT_PORT_ID];
  const normalized = idOrName.toLowerCase().trim();
  if (PORTS[normalized]) return PORTS[normalized];
  // Match by name or code
  const found = Object.values(PORTS).find(
    p => p.id === normalized || p.name.toLowerCase() === normalized || p.code.toLowerCase() === normalized
  );
  return found || PORTS[DEFAULT_PORT_ID];
}

// Backward-compatible dictionary keyed by name
export const HARBOURS: Record<string, PortDefinition> = Object.values(PORTS).reduce((acc, port) => {
  acc[port.name] = port;
  return acc;
}, {} as Record<string, PortDefinition>);

// Deleted mock arrays so the backend provides authentic data
