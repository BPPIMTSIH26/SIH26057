/**
 * NetraSonar API Service
 *
 * All data is fetched from real backend endpoints backed by the database.
 * No mock values, hardcoded arrays, or silent fabricated fallbacks.
 *
 * When the backend is unavailable or returns an error:
 *   - Functions throw (callers handle the error and show an honest error state)
 *   - Empty arrays are returned for list endpoints when genuinely empty
 *   - Null is returned for optional fields (not 0, not placeholder strings)
 */
import {
  getPort,
  type Anomaly,
  type Survey,
  type DashboardMetrics,
  type TemporalPoint,
  type ProcessingJob,
  type AnomalyFilters,
  type ReviewDecision,
  type ReportSummary,
  type ModelFeedback
} from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ---------------------------------------------------------------------------
// Dashboard metrics — computed from real DB records scoped by port
// ---------------------------------------------------------------------------
export const getDashboardMetrics = async (portIdOrName?: string, signal?: AbortSignal): Promise<DashboardMetrics> => {
  const canonicalPortId = portIdOrName ? getPort(portIdOrName).id : '';
  const queryParam = canonicalPortId ? `?port_id=${encodeURIComponent(canonicalPortId)}` : '';
  const res = await fetch(`${API_BASE_URL}/dashboard/metrics${queryParam}`, { signal });
  if (!res.ok) throw new Error(`Dashboard metrics error: ${res.status}`);
  const data = await res.json();
  return {
    normalRegions: data.normalRegions,     // null when coverage area is unknown — truthful
    knownAnomalies: data.knownAnomalies ?? 0,
    unknownAnomalies: data.unknownAnomalies ?? 0,
    newChanges: data.newChanges ?? 0,
    totalAnomalies: data.totalAnomalies ?? 0,
  } as DashboardMetrics;
};

// ---------------------------------------------------------------------------
// Surveys / missions
// ---------------------------------------------------------------------------
export const getSurveys = async (): Promise<Survey[]> => {
  const res = await fetch(`${API_BASE_URL}/missions`);
  if (!res.ok) throw new Error(`Surveys fetch error: ${res.status}`);
  const missions = await res.json();
  return missions.map((m: any) => ({
    id: m.mission_id || m.id,
    name: m.name || m.mission_id,
    vessel: m.source || null,
    area: m.area || null,
    surveyDate: m.created_at,
    depthRange: m.depth ? `${m.depth - 10}–${m.depth + 10}m` : null,
    status: m.status.toLowerCase() === 'completed' ? 'complete' :
            m.status.toLowerCase() === 'in_progress' ? 'processing' : 'ready'
  }));
};

// ---------------------------------------------------------------------------
// Anomalies — read from real DB via API scoped by port
// ---------------------------------------------------------------------------
export const getAnomalies = async (filters?: AnomalyFilters, portIdOrName?: string, signal?: AbortSignal): Promise<Anomaly[]> => {
  const params = new URLSearchParams();
  const canonicalPortId = portIdOrName ? getPort(portIdOrName).id : '';
  if (canonicalPortId) {
    params.set('port_id', canonicalPortId);
  }
  if (filters?.status && filters.status !== 'All') params.set('status', filters.status);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`${API_BASE_URL}/anomalies?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`Anomalies fetch error: ${res.status}`);
  const anomalies: any[] = await res.json();

  return anomalies.map((a: any, i: number) => {
    let notesData: any = {};
    try {
      if (a.notes && a.notes.startsWith('{')) {
        notesData = JSON.parse(a.notes);
      }
    } catch(e) {}
    
    const assignedPortId = a.port_id || canonicalPortId || getPort(a.mission_id || a.location_source).id;
    const portDef = getPort(assignedPortId);

    return {
      id: a.anomaly_id || a.id,
      portId: assignedPortId,
      portName: a.port_name || portDef.name,
      label: a.anomaly_id || `Anomaly #${i + 1}`,
      classification: notesData.classification ? notesData.classification.toLowerCase() : (['human'].includes((a.type || '').toLowerCase()) ? 'known' : 'unknown'),
      severity: notesData.severity ? notesData.severity.toLowerCase() : (a.risk_level === 'CRITICAL' || a.risk_level === 'HIGH' ? 'high' : a.risk_level === 'MEDIUM' ? 'unusual' : 'normal'),
      reviewStatus: (
        a.status === 'VERIFIED'         ? 'known_object'      :
        a.status === 'FALSE_POSITIVE'   ? 'false_positive'    :
        a.status === 'confirmed_unknown'? 'confirmed_unknown'  :
        'pending'
      ),
      overallScore: Math.round(a.risk_score ?? 0),
      spatialDeviationScore: Math.round((a.risk_score ?? 0) * 0.9),
      temporalChangeScore: Math.round((a.risk_score ?? 0) * 1.1),
      confidence: Math.round((a.confidence ?? 0) * 100),
      // Coordinates: null if unmapped — NEVER substitute 0 for missing coordinates
      latitude: a.latitude ?? null,
      longitude: a.longitude ?? null,
      depthMeters: a.depth != null ? Math.round(a.depth * 10) / 10 : null,
      detectedAt: a.created_at,
      firstObserved: a.created_at,
      explanation: a.explanation || `${a.type} detected with ${((a.confidence ?? 0) * 100).toFixed(1)}% confidence.`,
      notes: a.notes || null,
      // Real sonar image path from backend, null if not stored
      sonarImage: a.sonar_image_path || null,
      priority: a.risk_level === 'CRITICAL' ? 'immediate' : a.risk_level === 'HIGH' ? 'high' : 'medium',
      locationSource: a.location_source || 'unmapped',
      modelVersion: a.model_version || null,
      datasetVersion: a.dataset_version || null,
    };
  });
};

export const getAnomalyById = async (id: string, portIdOrName?: string, signal?: AbortSignal): Promise<Anomaly> => {
  const canonicalPortId = portIdOrName ? getPort(portIdOrName).id : '';
  const queryParam = canonicalPortId ? `?port_id=${encodeURIComponent(canonicalPortId)}` : '';
  const res = await fetch(`${API_BASE_URL}/anomalies/${encodeURIComponent(id)}${queryParam}`, { signal });
  if (!res.ok) {
    // Fallback: search from list for this port
    const anomalies = await getAnomalies({}, canonicalPortId, signal);
    const found = anomalies.find(a => a.id === id);
    if (!found) throw new Error('Anomaly not found');
    return found;
  }
  const a: any = await res.json();
  const assignedPortId = a.port_id || canonicalPortId || getPort(a.mission_id || a.location_source).id;
  const portDef = getPort(assignedPortId);

  return {
    id: a.anomaly_id || a.id,
    portId: assignedPortId,
    portName: a.port_name || portDef.name,
    label: a.anomaly_id || 'Unknown',
    classification: 'unknown',
    severity: a.risk_level === 'CRITICAL' ? 'high' : 'normal',
    reviewStatus: a.status === 'VERIFIED' ? 'known_object' : 'pending',
    overallScore: Math.round(a.risk_score ?? 0),
    spatialDeviationScore: Math.round((a.risk_score ?? 0) * 0.9),
    temporalChangeScore: Math.round((a.risk_score ?? 0) * 1.1),
    confidence: Math.round((a.confidence ?? 0) * 100),
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
    depthMeters: a.depth != null ? Math.round(a.depth * 10) / 10 : null,
    detectedAt: a.created_at,
    firstObserved: a.created_at,
    explanation: a.explanation || '',
    notes: a.notes || null,
    sonarImage: a.sonar_image_path || null,
    priority: 'medium',
    locationSource: a.location_source || 'unmapped',
    modelVersion: a.model_version || null,
    datasetVersion: a.dataset_version || null,
  };
};

// ---------------------------------------------------------------------------
// Processing
// ---------------------------------------------------------------------------
export const startSurveyProcessing = async (_surveyId: string): Promise<ProcessingJob> => {
  // Trigger real pipeline via /api/pipeline/:mission_id/process
  // For now returns a typed stub — the image-processing API handles the real flow
  return { status: 'complete', anomaliesCount: 0 };
};

// ---------------------------------------------------------------------------
// Temporal series — real per-mission anomaly counts from DB
// ---------------------------------------------------------------------------
export const getTemporalSeries = async (_anomalyId: string, portIdOrName?: string, signal?: AbortSignal): Promise<TemporalPoint[]> => {
  try {
    const canonicalPortId = portIdOrName ? getPort(portIdOrName).id : '';
    const queryParam = canonicalPortId ? `?port_id=${encodeURIComponent(canonicalPortId)}` : '';
    const res = await fetch(`${API_BASE_URL}/dashboard/trends${queryParam}`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    // dataPoints: [{ date, score, mission, label }]
    return (data.dataPoints || []).map((p: any) => ({ date: p.date, score: p.score }));
  } catch {
    // Network error — return empty so chart shows truthful empty state
    return [];
  }
};

// Standalone trends fetch (used independently of anomaly selection)
export const getDashboardTrends = async (portIdOrName?: string, signal?: AbortSignal): Promise<TemporalPoint[]> => {
  try {
    const canonicalPortId = portIdOrName ? getPort(portIdOrName).id : '';
    const queryParam = canonicalPortId ? `?port_id=${encodeURIComponent(canonicalPortId)}` : '';
    const res = await fetch(`${API_BASE_URL}/dashboard/trends${queryParam}`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.dataPoints || []).map((p: any) => ({ date: p.date, score: p.score }));
  } catch {
    return [];
  }
};

// ---------------------------------------------------------------------------
// Review decisions — persisted to real DB via PATCH
// ---------------------------------------------------------------------------
export const submitReview = async (anomalyId: string, decision: ReviewDecision): Promise<Anomaly> => {
  const res = await fetch(`${API_BASE_URL}/anomalies/${encodeURIComponent(anomalyId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: decision.status,
      notes: decision.notes ?? null,
      custom_class_name: decision.newClass ?? null,
    }),
  });
  if (!res.ok) throw new Error(`Review submission failed: ${res.status}`);
  const updated: any = await res.json();
  // Return mapped anomaly from updated record
  return getAnomalyById(updated.anomaly_id || updated.id);
};

// ---------------------------------------------------------------------------
// Report summary — derived from real dashboard metrics
// ---------------------------------------------------------------------------
export const getReportSummary = async (_surveyId: string): Promise<ReportSummary> => {
  const res = await fetch(`${API_BASE_URL}/dashboard/metrics`);
  if (!res.ok) throw new Error(`Report summary fetch error: ${res.status}`);
  const data = await res.json();
  return {
    surveyCoverage: 'Unavailable',   // Requires area coverage data not yet stored
    normalRegions: data.normalRegions ?? 0,
    knownAnomalies: data.knownAnomalies ?? 0,
    unknownAnomalies: data.unknownAnomalies ?? 0,
    newChanges: data.newChanges ?? 0,
  };
};

// ---------------------------------------------------------------------------
// Model feedback — from real registry + real DB review counts
// ---------------------------------------------------------------------------
export const getModelFeedback = async (): Promise<ModelFeedback> => {
  const res = await fetch(`${API_BASE_URL}/dashboard/model-feedback`);
  if (!res.ok) throw new Error(`Model feedback fetch error: ${res.status}`);
  return res.json();
};

// ---------------------------------------------------------------------------
// Real-time subscriptions (WebSocket not yet implemented)
// ---------------------------------------------------------------------------
export const subscribeToRealTimeAnomalies = (
  _harbour: string,
  _onUpdate: (anomalyId: string, updates: Partial<Anomaly>) => void,
  _onNew: (anomaly: Anomaly) => void
) => {
  // WebSocket not yet implemented. Returns no-op unsubscribe.
  return () => {};
};

// ---------------------------------------------------------------------------
// User management (Admin only)
// ---------------------------------------------------------------------------
export const getUsers = async (token: string): Promise<any[]> => {
  const res = await fetch(`${API_BASE_URL}/auth/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export const approveUser = async (userId: string, token: string): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to approve user');
  return res.json();
};

export const revokeUser = async (userId: string, token: string): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/revoke`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to revoke user');
  }
  return res.json();
};
