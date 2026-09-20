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
  vessel: string;
}

export const PORTS: Record<string, PortDefinition> = {
  'mumbai': { id: 'mumbai', name: 'Mumbai Harbor Q3', code: 'MUM', lat: 18.9387, lng: 72.8353, waterCenter: { lat: 18.9387, lng: 72.8353 }, spread: 0.04, vessel: 'R/V Samudra' },
  'chennai': { id: 'chennai', name: 'Chennai Port', code: 'CHE', lat: 13.0827, lng: 80.2707, waterCenter: { lat: 13.0827, lng: 80.2707 }, spread: 0.04, vessel: 'R/V Sagar Kanya' },
  'kochi': { id: 'kochi', name: 'Kochi Harbor', code: 'KOC', lat: 9.9312, lng: 76.2673, waterCenter: { lat: 9.9312, lng: 76.2673 }, spread: 0.04, vessel: 'R/V Sindhu Sadhana' },
  'visakhapatnam': { id: 'visakhapatnam', name: 'Visakhapatnam Port', code: 'VIZ', lat: 17.6868, lng: 83.2185, waterCenter: { lat: 17.6868, lng: 83.2185 }, spread: 0.04, vessel: 'R/V Gaveshani' },
  'jawaharlal-nehru': { id: 'jawaharlal-nehru', name: 'Jawaharlal Nehru Port', code: 'JAW', lat: 18.9500, lng: 72.9500, waterCenter: { lat: 18.9500, lng: 72.9500 }, spread: 0.04, vessel: 'R/V Sagar Nidhi' },
  'kolkata': { id: 'kolkata', name: 'Kolkata Port', code: 'KOL', lat: 22.5314, lng: 88.3225, waterCenter: { lat: 22.5314, lng: 88.3225 }, spread: 0.04, vessel: 'R/V Sagar Manjusha' },
  'paradip': { id: 'paradip', name: 'Paradip Port', code: 'PAR', lat: 20.2662, lng: 86.6775, waterCenter: { lat: 20.2662, lng: 86.6775 }, spread: 0.04, vessel: 'R/V Anveshani' },
  'thunder-bay': { id: 'thunder-bay', name: 'Thunder Bay, Lake Huron', code: 'THU', lat: 45.0600, lng: -83.4300, waterCenter: { lat: 45.0600, lng: -83.4300 }, spread: 0.04, vessel: 'AUV Iver3 (AI4Shipwrecks)' },
  'lake-huron': { id: 'lake-huron', name: 'Lake Huron', code: 'LAK', lat: 45.0600, lng: -83.4300, waterCenter: { lat: 45.0600, lng: -83.4300 }, spread: 0.04, vessel: 'AUV Iver3' },
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
