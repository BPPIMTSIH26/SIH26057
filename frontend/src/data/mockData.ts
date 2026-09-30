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
    lat: 18.9300, lng: 72.8900,
    waterCenter: { lat: 18.9300, lng: 72.8900 }, spread: 0.04,
    vessel: 'R/V Samudra',
    areaSqKm: 28,
    maxDepthMeters: 14,
    annualThroughputTEU: 200,
    authority: 'Mumbai Port Authority',
    waterCoordinates: [
      { latitude: 18.9120, longitude: 72.8750 }, { latitude: 18.9310, longitude: 72.8920 },
      { latitude: 18.9480, longitude: 72.8800 }, { latitude: 18.9050, longitude: 72.8900 },
      { latitude: 18.9240, longitude: 72.9120 }, { latitude: 18.9420, longitude: 72.9010 },
      { latitude: 18.9180, longitude: 72.8680 }, { latitude: 18.9360, longitude: 72.9200 },
      { latitude: 18.8980, longitude: 72.8820 }, { latitude: 18.9520, longitude: 72.8900 },
      { latitude: 18.9100, longitude: 72.9050 }, { latitude: 18.9280, longitude: 72.8780 },
      { latitude: 18.9400, longitude: 72.9150 }, { latitude: 18.9020, longitude: 72.8980 },
      { latitude: 18.9330, longitude: 72.8850 }, { latitude: 18.9200, longitude: 72.8950 }
    ]
  },
  'chennai': {
    id: 'chennai', name: 'Chennai Port', code: 'CHE',
    lat: 13.0900, lng: 80.3150,
    waterCenter: { lat: 13.0900, lng: 80.3150 }, spread: 0.04,
    vessel: 'R/V Sagar Kanya',
    areaSqKm: 24,
    maxDepthMeters: 18,
    annualThroughputTEU: 160,
    authority: 'Chennai Port Authority',
    waterCoordinates: [
      { latitude: 13.0720, longitude: 80.3020 }, { latitude: 13.0890, longitude: 80.3180 },
      { latitude: 13.1050, longitude: 80.3080 }, { latitude: 13.1180, longitude: 80.3320 },
      { latitude: 13.0680, longitude: 80.3200 }, { latitude: 13.0820, longitude: 80.2990 },
      { latitude: 13.0980, longitude: 80.3400 }, { latitude: 13.1120, longitude: 80.3120 },
      { latitude: 13.0780, longitude: 80.3350 }, { latitude: 13.0920, longitude: 80.3050 },
      { latitude: 13.1240, longitude: 80.3250 }, { latitude: 13.0640, longitude: 80.3080 },
      { latitude: 13.0850, longitude: 80.3280 }, { latitude: 13.1010, longitude: 80.2980 },
      { latitude: 13.1150, longitude: 80.3450 }, { latitude: 13.0750, longitude: 80.3120 }
    ]
  },
  'kochi': {
    id: 'kochi', name: 'Kochi Harbor', code: 'KOC',
    lat: 9.9650, lng: 76.2100,
    waterCenter: { lat: 9.9650, lng: 76.2100 }, spread: 0.04,
    vessel: 'R/V Sindhu Sadhana',
    areaSqKm: 15,
    maxDepthMeters: 13,
    annualThroughputTEU: 74,
    authority: 'Cochin Port Authority',
    waterCoordinates: [
      { latitude: 9.9420, longitude: 76.2180 }, { latitude: 9.9580, longitude: 76.1950 },
      { latitude: 9.9720, longitude: 76.2300 }, { latitude: 9.9860, longitude: 76.1750 },
      { latitude: 9.9350, longitude: 76.2380 }, { latitude: 9.9510, longitude: 76.2100 },
      { latitude: 9.9650, longitude: 76.1820 }, { latitude: 9.9800, longitude: 76.2220 },
      { latitude: 9.9920, longitude: 76.1680 }, { latitude: 9.9480, longitude: 76.1900 },
      { latitude: 9.9610, longitude: 76.2350 }, { latitude: 9.9760, longitude: 76.2020 },
      { latitude: 9.9880, longitude: 76.1880 }, { latitude: 9.9390, longitude: 76.2250 },
      { latitude: 9.9540, longitude: 76.1780 }, { latitude: 9.9690, longitude: 76.2150 }
    ]
  },
  'visakhapatnam': {
    id: 'visakhapatnam', name: 'Visakhapatnam Port', code: 'VIZ',
    lat: 17.6900, lng: 83.3150,
    waterCenter: { lat: 17.6900, lng: 83.3150 }, spread: 0.04,
    vessel: 'R/V Gaveshani',
    areaSqKm: 21,
    maxDepthMeters: 18.1,
    annualThroughputTEU: 72,
    authority: 'Visakhapatnam Port Authority',
    waterCoordinates: [
      { latitude: 17.6620, longitude: 83.2980 }, { latitude: 17.6780, longitude: 83.3220 },
      { latitude: 17.6920, longitude: 83.2900 }, { latitude: 17.7080, longitude: 83.3380 },
      { latitude: 17.7210, longitude: 83.3100 }, { latitude: 17.6550, longitude: 83.3150 },
      { latitude: 17.6710, longitude: 83.3400 }, { latitude: 17.6850, longitude: 83.3050 },
      { latitude: 17.7010, longitude: 83.3280 }, { latitude: 17.7150, longitude: 83.2950 },
      { latitude: 17.6680, longitude: 83.3300 }, { latitude: 17.6810, longitude: 83.2880 },
      { latitude: 17.6960, longitude: 83.3180 }, { latitude: 17.7110, longitude: 83.3420 },
      { latitude: 17.7250, longitude: 83.3000 }, { latitude: 17.6750, longitude: 83.3120 }
    ]
  },
  'jawaharlal-nehru': {
    id: 'jawaharlal-nehru', name: 'Jawaharlal Nehru Port', code: 'JAW',
    lat: 18.9400, lng: 72.9150,
    waterCenter: { lat: 18.9400, lng: 72.9150 }, spread: 0.04,
    vessel: 'R/V Sagar Nidhi',
    areaSqKm: 30,
    maxDepthMeters: 15,
    annualThroughputTEU: 580,
    authority: 'Jawaharlal Nehru Port Authority',
    waterCoordinates: [
      { latitude: 18.9220, longitude: 72.9050 }, { latitude: 18.9350, longitude: 72.9180 },
      { latitude: 18.9480, longitude: 72.9020 }, { latitude: 18.9150, longitude: 72.9250 },
      { latitude: 18.9410, longitude: 72.9300 }, { latitude: 18.9290, longitude: 72.8950 },
      { latitude: 18.9520, longitude: 72.9150 }, { latitude: 18.9180, longitude: 72.9100 },
      { latitude: 18.9380, longitude: 72.8900 }, { latitude: 18.9450, longitude: 72.9250 },
      { latitude: 18.9260, longitude: 72.9320 }, { latitude: 18.9330, longitude: 72.9080 },
      { latitude: 18.9500, longitude: 72.8980 }, { latitude: 18.9120, longitude: 72.9180 },
      { latitude: 18.9400, longitude: 72.9120 }, { latitude: 18.9270, longitude: 72.9200 }
    ]
  },
  'kolkata': {
    id: 'kolkata', name: 'Kolkata Port', code: 'KOL',
    lat: 22.5350, lng: 88.3050,
    waterCenter: { lat: 22.5350, lng: 88.3050 }, spread: 0.04,
    vessel: 'R/V Sagar Manjusha',
    areaSqKm: 8,
    maxDepthMeters: 8.5,
    annualThroughputTEU: 25,
    authority: 'Syama Prasad Mookerjee Port',
    waterCoordinates: [
      { latitude: 22.5520, longitude: 88.3120 }, { latitude: 22.5430, longitude: 88.3080 },
      { latitude: 22.5350, longitude: 88.3040 }, { latitude: 22.5280, longitude: 88.3000 },
      { latitude: 22.5210, longitude: 88.2920 }, { latitude: 22.5120, longitude: 88.2840 },
      { latitude: 22.5030, longitude: 88.2750 }, { latitude: 22.5480, longitude: 88.3150 },
      { latitude: 22.5390, longitude: 88.3060 }, { latitude: 22.5310, longitude: 88.3020 },
      { latitude: 22.5240, longitude: 88.2960 }, { latitude: 22.5160, longitude: 88.2880 },
      { latitude: 22.5070, longitude: 88.2790 }, { latitude: 22.5410, longitude: 88.3100 },
      { latitude: 22.5260, longitude: 88.2980 }, { latitude: 22.5180, longitude: 88.2900 }
    ]
  },
  'paradip': {
    id: 'paradip', name: 'Paradip Port', code: 'PAR',
    lat: 20.2650, lng: 86.7250,
    waterCenter: { lat: 20.2650, lng: 86.7250 }, spread: 0.04,
    vessel: 'R/V Anveshani',
    areaSqKm: 18,
    maxDepthMeters: 17,
    annualThroughputTEU: 12,
    authority: 'Paradip Port Authority',
    waterCoordinates: [
      { latitude: 20.2420, longitude: 86.7050 }, { latitude: 20.2580, longitude: 86.7320 },
      { latitude: 20.2710, longitude: 86.6980 }, { latitude: 20.2850, longitude: 86.7450 },
      { latitude: 20.2960, longitude: 86.7180 }, { latitude: 20.2360, longitude: 86.7250 },
      { latitude: 20.2510, longitude: 86.7500 }, { latitude: 20.2650, longitude: 86.7100 },
      { latitude: 20.2780, longitude: 86.7380 }, { latitude: 20.2910, longitude: 86.7020 },
      { latitude: 20.2480, longitude: 86.7400 }, { latitude: 20.2610, longitude: 86.6950 },
      { latitude: 20.2740, longitude: 86.7220 }, { latitude: 20.2880, longitude: 86.7550 },
      { latitude: 20.2990, longitude: 86.7120 }, { latitude: 20.2550, longitude: 86.7160 }
    ]
  },
  'thunder-bay': {
    id: 'thunder-bay', name: 'Thunder Bay, Lake Huron', code: 'THU',
    lat: 45.0350, lng: -83.3500,
    waterCenter: { lat: 45.0350, lng: -83.3500 }, spread: 0.04,
    vessel: 'AUV Iver3 (AI4Shipwrecks)',
    areaSqKm: 1148,
    maxDepthMeters: 55,
    annualThroughputTEU: 0,
    authority: 'NOAA Thunder Bay NMS',
    waterCoordinates: [
      { latitude: 45.0250, longitude: -83.4000 }, { latitude: 45.0150, longitude: -83.3700 },
      { latitude: 45.0380, longitude: -83.3500 }, { latitude: 45.0480, longitude: -83.3100 },
      { latitude: 45.0220, longitude: -83.3300 }, { latitude: 45.0420, longitude: -83.3800 },
      { latitude: 45.0100, longitude: -83.3500 }, { latitude: 45.0320, longitude: -83.2900 },
      { latitude: 45.0520, longitude: -83.2700 }, { latitude: 45.0280, longitude: -83.3600 },
      { latitude: 45.0450, longitude: -83.3400 }, { latitude: 45.0180, longitude: -83.3100 },
      { latitude: 45.0350, longitude: -83.3900 }, { latitude: 45.0580, longitude: -83.2500 },
      { latitude: 45.0240, longitude: -83.2800 }, { latitude: 45.0400, longitude: -83.3200 }
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
