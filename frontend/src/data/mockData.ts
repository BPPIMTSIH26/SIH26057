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
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  waterCenter: { lat: number; lng: number };
  spread: number;
  waterCoordinates?: Array<{ latitude: number; longitude: number }>;
  vessel: string;
}

export const PORTS: Record<string, PortDefinition> = {
  'mumbai': { 
    id: 'mumbai', name: 'Mumbai Harbor Q3', code: 'MUM', lat: 18.9387, lng: 72.8353, 
    waterCenter: { lat: 18.9387, lng: 72.8353 }, spread: 0.04, vessel: 'R/V Samudra',
    waterCoordinates: [
      { latitude: 18.9100, longitude: 72.8600 }, { latitude: 18.9180, longitude: 72.8700 },
      { latitude: 18.9250, longitude: 72.8820 }, { latitude: 18.9320, longitude: 72.8950 },
      { latitude: 18.9400, longitude: 72.9050 }, { latitude: 18.9470, longitude: 72.9150 },
      { latitude: 18.9150, longitude: 72.8750 }, { latitude: 18.9220, longitude: 72.9000 }
    ]
  },
  'chennai': { 
    id: 'chennai', name: 'Chennai Port', code: 'CHE', lat: 13.0827, lng: 80.2707, 
    waterCenter: { lat: 13.0827, lng: 80.2707 }, spread: 0.04, vessel: 'R/V Sagar Kanya',
    waterCoordinates: [
      { latitude: 13.0850, longitude: 80.2980 }, { latitude: 13.0920, longitude: 80.3050 },
      { latitude: 13.1000, longitude: 80.3150 }, { latitude: 13.1080, longitude: 80.3250 },
      { latitude: 13.0780, longitude: 80.2960 }, { latitude: 13.1150, longitude: 80.3350 },
      { latitude: 13.1220, longitude: 80.3420 }, { latitude: 13.0650, longitude: 80.2970 }
    ]
  },
  'kochi': { 
    id: 'kochi', name: 'Kochi Harbor', code: 'KOC', lat: 9.9312, lng: 76.2673, 
    waterCenter: { lat: 9.9312, lng: 76.2673 }, spread: 0.04, vessel: 'R/V Sindhu Sadhana',
    waterCoordinates: [
      { latitude: 9.9620, longitude: 76.2200 }, { latitude: 9.9700, longitude: 76.2100 },
      { latitude: 9.9780, longitude: 76.1900 }, { latitude: 9.9500, longitude: 76.2350 },
      { latitude: 9.9850, longitude: 76.1800 }, { latitude: 9.9400, longitude: 76.2450 },
      { latitude: 10.000, longitude: 76.1700 }, { latitude: 9.9650, longitude: 76.2280 }
    ]
  },
  'visakhapatnam': { 
    id: 'visakhapatnam', name: 'Visakhapatnam Port', code: 'VIZ', lat: 17.6868, lng: 83.2185, 
    waterCenter: { lat: 17.6868, lng: 83.2185 }, spread: 0.04, vessel: 'R/V Gaveshani',
    waterCoordinates: [
      { latitude: 17.6800, longitude: 83.2900 }, { latitude: 17.6900, longitude: 83.3000 },
      { latitude: 17.7000, longitude: 83.3100 }, { latitude: 17.7100, longitude: 83.3200 },
      { latitude: 17.6700, longitude: 83.2850 }, { latitude: 17.7200, longitude: 83.3300 },
      { latitude: 17.6600, longitude: 83.2800 }, { latitude: 17.7150, longitude: 83.3250 }
    ]
  },
  'jawaharlal-nehru': { 
    id: 'jawaharlal-nehru', name: 'Jawaharlal Nehru Port', code: 'JAW', lat: 18.9500, lng: 72.9500, 
    waterCenter: { lat: 18.9500, lng: 72.9500 }, spread: 0.04, vessel: 'R/V Sagar Nidhi',
    waterCoordinates: [
      { latitude: 18.9350, longitude: 72.9450 }, { latitude: 18.9450, longitude: 72.9550 },
      { latitude: 18.9550, longitude: 72.9650 }, { latitude: 18.9650, longitude: 72.9700 },
      { latitude: 18.9250, longitude: 72.9350 }, { latitude: 18.9750, longitude: 72.9720 },
      { latitude: 18.9400, longitude: 72.9500 }, { latitude: 18.9500, longitude: 72.9600 }
    ]
  },
  'kolkata': { 
    id: 'kolkata', name: 'Kolkata Port', code: 'KOL', lat: 22.5314, lng: 88.3225, 
    waterCenter: { lat: 22.5314, lng: 88.3225 }, spread: 0.04, vessel: 'R/V Sagar Manjusha',
    waterCoordinates: [
      { latitude: 22.5100, longitude: 88.3000 }, { latitude: 22.5200, longitude: 88.3050 },
      { latitude: 22.5300, longitude: 88.3100 }, { latitude: 22.5400, longitude: 88.3050 },
      { latitude: 22.5000, longitude: 88.2950 }, { latitude: 22.5500, longitude: 88.3000 },
      { latitude: 22.5150, longitude: 88.3020 }, { latitude: 22.5250, longitude: 88.3070 }
    ]
  },
  'paradip': { 
    id: 'paradip', name: 'Paradip Port', code: 'PAR', lat: 20.2662, lng: 86.6775, 
    waterCenter: { lat: 20.2662, lng: 86.6775 }, spread: 0.04, vessel: 'R/V Anveshani',
    waterCoordinates: [
      { latitude: 20.2600, longitude: 86.7000 }, { latitude: 20.2700, longitude: 86.7200 },
      { latitude: 20.2800, longitude: 86.7400 }, { latitude: 20.2500, longitude: 86.6950 },
      { latitude: 20.2900, longitude: 86.7500 }, { latitude: 20.2650, longitude: 86.7100 },
      { latitude: 20.2750, longitude: 86.7300 }, { latitude: 20.2550, longitude: 86.6970 }
    ]
  },
  'thunder-bay': { 
    id: 'thunder-bay', name: 'Thunder Bay, Lake Huron', code: 'THU', lat: 45.0600, lng: -83.4300, 
    waterCenter: { lat: 45.0600, lng: -83.4300 }, spread: 0.04, vessel: 'AUV Iver3 (AI4Shipwrecks)',
    waterCoordinates: [
      { latitude: 45.0400, longitude: -83.4200 }, { latitude: 45.0500, longitude: -83.4000 },
      { latitude: 45.0600, longitude: -83.3800 }, { latitude: 45.0700, longitude: -83.3600 },
      { latitude: 45.0800, longitude: -83.3400 }, { latitude: 45.0900, longitude: -83.3200 },
      { latitude: 45.0350, longitude: -83.4100 }, { latitude: 45.0450, longitude: -83.3900 }
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
