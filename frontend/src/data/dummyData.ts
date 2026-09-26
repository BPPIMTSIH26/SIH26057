import { Anomaly, Survey, DashboardMetrics, TemporalPoint, ReportSummary } from './mockData';

export const DUMMY_METRICS: DashboardMetrics = {
  normalRegions: 85,
  knownAnomalies: 12,
  unknownAnomalies: 3,
  newChanges: 2,
};

export const DUMMY_SURVEYS: Survey[] = [
  {
    id: "survey-001",
    name: "MUM-2026-09-A",
    vessel: "R/V Samudra",
    area: "Mumbai Harbor Q3",
    surveyDate: new Date().toISOString(),
    depthRange: "10-25m",
    status: "complete"
  }
];

export const DUMMY_ANOMALIES: Anomaly[] = [
  {
    id: "anom-001",
    portId: "mumbai",
    portName: "Mumbai Harbor Q3",
    label: "Anomaly #1 - UNKNOWN",
    classification: "unknown",
    severity: "high",
    reviewStatus: "pending",
    overallScore: 88,
    spatialDeviationScore: 75,
    temporalChangeScore: 92,
    confidence: 85,
    latitude: 18.9387,
    longitude: 72.8353,
    depthMeters: 14.5,
    detectedAt: new Date().toISOString(),
    firstObserved: new Date().toISOString(),
    explanation: "Unusual structural deviation detected on the seabed.",
    sonarImage: "",
    priority: "high",
    locationSource: "unmapped"
  },
  {
    id: "anom-002",
    portId: "mumbai",
    portName: "Mumbai Harbor Q3",
    label: "Anomaly #2 - MINE-LIKE",
    classification: "known",
    severity: "unusual",
    reviewStatus: "known_object",
    overallScore: 65,
    spatialDeviationScore: 50,
    temporalChangeScore: 40,
    confidence: 90,
    latitude: 18.9400,
    longitude: 72.8400,
    depthMeters: 12.0,
    detectedAt: new Date().toISOString(),
    firstObserved: new Date().toISOString(),
    explanation: "Object matches known historical artifact profile.",
    sonarImage: "",
    priority: "medium",
    locationSource: "unmapped"
  }
];

export const DUMMY_TRENDS: TemporalPoint[] = [
  { date: "2026-09-01", score: 10 },
  { date: "2026-09-08", score: 12 },
  { date: "2026-09-15", score: 8 },
  { date: "2026-09-22", score: 15 },
];
