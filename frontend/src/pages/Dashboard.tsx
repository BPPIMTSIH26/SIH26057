import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CheckCircle, AlertTriangle, AlertCircle, TrendingUp, Anchor, Zap, RefreshCw, Ship, MapPin, Waves, Building2 } from 'lucide-react';

import MetricCard from '../components/ui/MetricCard';
import PriorityQueue from '../components/ui/PriorityQueue';
import ActiveLearningWidget from '../components/ui/ActiveLearningWidget';
import {
  getDashboardMetrics,
  getAnomalies,
  getModelFeedback,
  getDashboardTrends
} from '../services/api';
import { DashboardMetrics, Anomaly, TemporalPoint, ModelFeedback } from '../data/mockData';
import { usePort, useRealTimeAnomalies } from '../contexts/AppContext';
import { Map, Marker } from '../components/RawMap';
import { getHarbourViewport, fitMapToHarbourAndPoints } from '../utils/mapUtils';

export default function Dashboard() {
  const { selectedPortId, selectedPort, setSelectedPortId, ports } = usePort();
  const navigate = useNavigate();
  const realTimeUpdates = useRealTimeAnomalies();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [chartData, setChartData] = useState<TemporalPoint[]>([]);
  const [modelFeedback, setModelFeedback] = useState<ModelFeedback | null>(null);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoPatrol, setIsAutoPatrol] = useState(false);
  const mapRef = useRef<any>(null);
  const mapFitTimerRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);
  const patrolIndicesRef = useRef<Record<string, number>>({});

  // Merge real-time websocket updates with fetched anomalies
  const liveAnomalies = useMemo(() =>
    anomalies.map(a => ({ ...a, ...(realTimeUpdates[a.id] || {}) })),
    [anomalies, realTimeUpdates]
  );

  // Strictly filter anomalies to the currently selected port ID
  const portAnomalies = useMemo(() =>
    liveAnomalies.filter(a => !a.portId || a.portId === selectedPortId),
    [liveAnomalies, selectedPortId]
  );

  // Inspector anomaly strictly validated to match the current selected port
  const selectedAnomaly = useMemo(() => {
    if (!selectedAnomalyId) return null;
    const found = portAnomalies.find(a => a.id === selectedAnomalyId);
    if (!found) return null;
    if (found.portId && found.portId !== selectedPortId) return null;
    return found;
  }, [portAnomalies, selectedAnomalyId, selectedPortId]);

  // Viewport calculation based on canonical selected port
  const initialVp = useMemo(() => getHarbourViewport(selectedPort, selectedAnomaly), [selectedPort, selectedAnomaly]);

  // Frame both port and anomaly on map with debouncing to prevent thrashing
  useEffect(() => {
    if (mapFitTimerRef.current) clearTimeout(mapFitTimerRef.current);
    mapFitTimerRef.current = setTimeout(() => {
      if (mapRef.current && selectedPort) {
        fitMapToHarbourAndPoints(
          mapRef.current,
          selectedPort,
          selectedAnomaly || (portAnomalies.length > 0 ? portAnomalies : null),
          { padding: 45, maxZoom: 11.4, duration: 1600 }
        );
      }
    }, 120);
  }, [selectedAnomaly?.id, selectedPort.lat, selectedPort.lng, selectedPortId, portAnomalies]);

  // Safe anomaly selection: guarantees port alignment before opening inspector
  const selectAnomaly = useCallback((anomaly: Anomaly) => {
    if (anomaly.portId && anomaly.portId !== selectedPortId) {
      setSelectedPortId(anomaly.portId);
    }
    setSelectedAnomalyId(anomaly.id);
    setIsAutoPatrol(false);
  }, [selectedPortId, setSelectedPortId]);

  // Data fetching scoped to selectedPortId with request cancellation & race condition guards
  const loadData = useCallback(async () => {
    const currentReqId = ++requestIdRef.current;

    // Cancel prior in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Immediately clear stale previous-port data before rendering or awaiting
    setAnomalies([]);
    setSelectedAnomalyId('');
    setMetrics(null);
    setChartData([]);
    setError(null);
    setIsLoading(true);

    try {
      const [m, a, mf, trends] = await Promise.all([
        getDashboardMetrics(selectedPortId, controller.signal),
        getAnomalies({}, selectedPortId, controller.signal),
        getModelFeedback(),
        getDashboardTrends(selectedPortId, controller.signal)
      ]);

      if (controller.signal.aborted || currentReqId !== requestIdRef.current) {
        return;
      }

      // Enforce port isolation on anomalies
      const scopedAnomalies = a.filter(item => !item.portId || item.portId === selectedPortId);
      setMetrics(m);
      setAnomalies(scopedAnomalies);
      setModelFeedback(mf);
      setChartData(trends);

      if (scopedAnomalies.length > 0) {
        if (isAutoPatrol) {
          const idx = patrolIndicesRef.current[selectedPortId] || 0;
          const nextIdx = idx % scopedAnomalies.length;
          setSelectedAnomalyId(scopedAnomalies[nextIdx].id);
        } else {
          const top = scopedAnomalies.find(x => x.priority === 'immediate') ||
                      scopedAnomalies.find(x => x.priority === 'high') ||
                      scopedAnomalies[0];
          setSelectedAnomalyId(top.id);
        }
      } else {
        setSelectedAnomalyId('');
      }
      setIsLoading(false);
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      if (currentReqId !== requestIdRef.current) {
        return;
      }
      console.error('Dashboard load error:', err);
      setError('Unable to load port telemetry. Check connection and retry.');
      setMetrics(null);
      setAnomalies([]);
      setChartData([]);
      setSelectedAnomalyId('');
      setIsLoading(false);
    }
  }, [selectedPortId, isAutoPatrol]);

  useEffect(() => {
    loadData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  // Auto patrol logic: cycles through canonical ports list safely
  useEffect(() => {
    if (!isAutoPatrol || ports.length === 0) return;

    const interval = setInterval(() => {
      const currentIndex = ports.findIndex(p => p.id === selectedPortId);
      const nextIndex = (currentIndex + 1) % ports.length;
      const nextPort = ports[nextIndex];

      if (patrolIndicesRef.current[nextPort.id] === undefined) {
        patrolIndicesRef.current[nextPort.id] = 0;
      } else {
        patrolIndicesRef.current[nextPort.id] += 1;
      }

      setSelectedPortId(nextPort.id);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPatrol, selectedPortId, setSelectedPortId, ports]);

  // Priority queue anomalies (filtered to selected port only)
  const priorityAnomalies = useMemo(() =>
    portAnomalies
      .filter(a => a.priority === 'immediate' || a.priority === 'high' || a.priority === 'medium')
      .sort((a, b) => b.overallScore - a.overallScore),
    [portAnomalies]
  );

  // Derived KPI metrics fallback to ensure port-only accuracy
  const derivedKnown = useMemo(() => 
    portAnomalies.filter(a => a.classification?.toUpperCase() === 'KNOWN').length,
    [portAnomalies]
  );
  const derivedUnknown = useMemo(() => 
    portAnomalies.filter(a => a.classification?.toUpperCase() === 'UNKNOWN').length,
    [portAnomalies]
  );
  const derivedNewChanges = useMemo(() => 
    portAnomalies.filter(a => a.severity === 'unusual' || a.severity === 'high').length,
    [portAnomalies]
  );

  const displayKnown = metrics?.knownAnomalies != null ? metrics.knownAnomalies : derivedKnown;
  const displayUnknown = metrics?.unknownAnomalies != null ? metrics.unknownAnomalies : derivedUnknown;
  const displayNewChanges = metrics?.newChanges != null ? metrics.newChanges : derivedNewChanges;

  return (
    <div className="relative flex flex-col h-full bg-void text-text-primary overflow-hidden">
      
      {/* ── FULL SCREEN DARK TECH BACKGROUND ── */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-glass-strong)_0%,_var(--color-void)_50%)]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 mix-blend-overlay" />
      </div>

      {/* ── BENTO BOX LAYOUT ── */}
      <div className="absolute inset-0 z-10 p-4 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar xl:overflow-hidden">
        <div className="max-w-[1600px] mx-auto xl:h-full flex flex-col xl:flex-row gap-4 lg:gap-6">
          
          {/* LEFT COLUMN */}
          <div className="flex-[2] flex flex-col gap-4 lg:gap-6 min-w-0 xl:min-h-0">
            
            {/* Top Ribbons (KPIs) - Scoped strictly to selected port */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 shrink-0">
              <div className="bg-glass backdrop-blur-3xl rounded-2xl border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
                <MetricCard 
                  label="Normal Regions" 
                  value={metrics?.normalRegions != null ? metrics.normalRegions : 'N/A'} 
                  icon={CheckCircle} 
                  colorClass="text-text-primary" 
                  isLoading={isLoading} 
                />
              </div>
              <div className="bg-glass backdrop-blur-3xl rounded-2xl border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
                <MetricCard 
                  label="Known Anomalies" 
                  value={displayKnown} 
                  icon={AlertTriangle} 
                  colorClass="text-warning" 
                  isLoading={isLoading} 
                />
              </div>
              <div className="bg-glass backdrop-blur-3xl rounded-2xl border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
                <MetricCard 
                  label="Unknown Anomalies" 
                  value={displayUnknown} 
                  icon={AlertCircle} 
                  colorClass="text-danger" 
                  isLoading={isLoading} 
                />
              </div>
              <div className="bg-glass backdrop-blur-3xl rounded-2xl border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
                <MetricCard 
                  label="New Changes" 
                  value={displayNewChanges} 
                  icon={TrendingUp} 
                  colorClass="text-cyan" 
                  trend={`${portAnomalies.length} total in ${selectedPort.code}`} 
                  trendDirection="down" 
                  isLoading={isLoading} 
                />
              </div>
            </div>

            {/* Port Intel Card */}
            <div className="shrink-0 bg-glass backdrop-blur-3xl rounded-2xl border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
              <div className="px-5 py-3 border-b border-glass-border bg-glass-strong flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-accent" />
                  <h3 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-primary">Port Intel</h3>
                </div>
                <span className="text-[9px] font-mono text-text-muted px-1.5 py-0.5 rounded bg-surface border border-glass-border">
                  {selectedPort.authority || 'N/A'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-glass-strong">
                <div className="bg-glass p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-text-muted" />
                    <span className="text-[9px] text-text-secondary uppercase tracking-widest font-bold">Survey Area</span>
                  </div>
                  <div className="text-text-primary font-mono text-sm font-light">{selectedPort.areaSqKm ?? 'N/A'} <span className="text-[9px] text-text-muted">km²</span></div>
                </div>
                <div className="bg-glass p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Waves className="w-3 h-3 text-text-muted" />
                    <span className="text-[9px] text-text-secondary uppercase tracking-widest font-bold">Max Depth</span>
                  </div>
                  <div className="text-text-primary font-mono text-sm font-light">{selectedPort.maxDepthMeters ?? 'N/A'} <span className="text-[9px] text-text-muted">m</span></div>
                </div>
                <div className="bg-glass p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-text-muted" />
                    <span className="text-[9px] text-text-secondary uppercase tracking-widest font-bold">Throughput</span>
                  </div>
                  <div className="text-text-primary font-mono text-sm font-light">{selectedPort.annualThroughputTEU != null ? `${(selectedPort.annualThroughputTEU * 10000).toLocaleString()}` : 'N/A'} <span className="text-[9px] text-text-muted">TEU/yr</span></div>
                </div>
                <div className="bg-glass p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Ship className="w-3 h-3 text-text-muted" />
                    <span className="text-[9px] text-text-secondary uppercase tracking-widest font-bold">Vessel</span>
                  </div>
                  <div className="text-text-primary font-mono text-[11px] font-light truncate" title={selectedPort.vessel}>{selectedPort.vessel}</div>
                </div>
                <div className="bg-glass p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Anchor className="w-3 h-3 text-text-muted" />
                    <span className="text-[9px] text-text-secondary uppercase tracking-widest font-bold">Seed Points</span>
                  </div>
                  <div className="text-text-primary font-mono text-sm font-light">{selectedPort.waterCoordinates?.length ?? 0} <span className="text-[9px] text-text-muted">coords</span></div>
                </div>
              </div>
            </div>

            {/* Minimap Section */}
            <div className="flex-1 bg-glass backdrop-blur-3xl rounded-2xl border border-glass-border p-1 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-h-[300px] md:min-h-[400px] overflow-hidden relative group">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-void/80 backdrop-blur-md border border-glass-border rounded-lg shadow-lg pointer-events-none">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-glow-pulse" />
                  <h3 className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-primary">
                    Minimap: {selectedPort.name}
                  </h3>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-surface border border-glass-border font-mono text-cyan">
                    {selectedPort.code}
                  </span>
                </div>
                <button 
                  onClick={() => setIsAutoPatrol(!isAutoPatrol)}
                  className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors border shadow-lg flex items-center gap-2 ${
                    isAutoPatrol 
                      ? 'bg-accent/20 border-accent/40 text-accent shadow-[var(--glow-accent)]' 
                      : 'bg-void/80 border-glass-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isAutoPatrol ? 'bg-accent animate-pulse' : 'bg-text-muted'}`} />
                  Auto Patrol
                </button>
              </div>

              <div className="flex-1 rounded-xl overflow-hidden relative pointer-events-auto">
                <Map
                  ref={mapRef}
                  initialViewState={{
                    longitude: initialVp.longitude,
                    latitude: initialVp.latitude,
                    zoom: initialVp.zoom,
                    pitch: 0,
                    bearing: 0,
                  }}
                  interactive={true}
                >
                  {/* Selected Port marker */}
                  <Marker longitude={selectedPort.lng} latitude={selectedPort.lat}>
                    <div className="flex flex-col items-center group cursor-pointer">
                      <div className="w-3.5 h-3.5 bg-accent rounded-sm border border-void shadow-[var(--glow-accent)] relative z-10 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-void rounded-xs" />
                      </div>
                      <div className="mt-1 px-2 py-0.5 bg-void/90 backdrop-blur border border-glass-border text-[9px] text-text-primary uppercase tracking-[0.15em] font-medium whitespace-nowrap rounded shadow-lg flex items-center gap-1.5">
                        <span className="text-accent font-semibold">{selectedPort.name}</span>
                        <span className="text-text-muted font-mono">[{selectedPort.code}]</span>
                      </div>
                    </div>
                  </Marker>
                  
                  {/* Anomaly Markers: strictly scoped to current selected port */}
                  {portAnomalies.filter(a => a.latitude !== null && a.longitude !== null).map(a => {
                    const isSelected = a.id === selectedAnomalyId;
                    return (
                      <Marker
                        key={a.id}
                        longitude={a.longitude}
                        latitude={a.latitude}
                      >
                        <div
                          onClick={() => selectAnomaly(a)}
                          className="cursor-pointer group flex flex-col items-center justify-center"
                          title={`${a.label} (${a.priority}) — ${selectedPort.name}`}
                        >
                          {isSelected ? (
                            <div className="relative flex items-center justify-center w-5 h-5">
                              <div className="absolute -inset-2 rounded-full border border-danger animate-ping opacity-60" style={{ animationDuration: '2.5s' }} />
                              <div className="w-3.5 h-3.5 rounded-full bg-danger border-2 border-void shadow-[0_0_12px_var(--color-danger)] relative z-10" />
                            </div>
                          ) : (
                            <div className={`w-2.5 h-2.5 rounded-full border border-void transition-transform group-hover:scale-125 ${
                              a.severity === 'high' ? 'bg-danger shadow-[0_0_6px_var(--color-danger)]' : 
                              a.severity === 'unusual' ? 'bg-warning' : 'bg-accent/80'
                            }`} />
                          )}
                        </div>
                      </Marker>
                    );
                  })}
                </Map>
                <div className="absolute inset-0 border border-glass-border rounded-xl pointer-events-none" />
              </div>
            </div>

            {/* Port-scoped Survey Trends Chart */}
            <div className="h-48 shrink-0 bg-glass backdrop-blur-3xl rounded-2xl border border-glass-border p-5 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-primary">
                    Survey Trends
                  </h3>
                  <span className="text-[9px] font-mono text-text-muted px-1.5 py-0.5 rounded bg-surface border border-glass-border">
                    {selectedPort.name}
                  </span>
                </div>
                {isLoading && <div className="w-3 h-3 border-2 border-glass-border border-t-cyan rounded-full animate-spin" />}
              </div>
              <div className="flex-1 w-full relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-end gap-2 animate-pulse pb-2">
                    {[...Array(24)].map((_, i) => (
                      <div key={i} className="flex-1 bg-glass rounded-t-sm" style={{ height: `${(Math.sin(i * 1234.5) * 0.5 + 0.5) * 60 + 20}%` }} />
                    ))}
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-glass-border/40 rounded-xl">
                    <span className="text-xs font-mono text-text-muted uppercase">No historical trend data recorded for {selectedPort.name}.</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-cyan)" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="var(--color-cyan)" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(11, 14, 20, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px' }}
                        itemStyle={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                        labelStyle={{ color: 'var(--color-text-secondary)', fontSize: '9px', marginBottom: '2px', fontFamily: 'var(--font-sans)' }}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="var(--color-cyan)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 4, fill: 'var(--color-void)', stroke: 'var(--color-cyan)', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="flex-[1] flex flex-col gap-4 lg:gap-6 shrink-0 w-full xl:min-w-[340px] xl:w-[400px] xl:min-h-0">
            
            {/* Inspector Node: Strictly scoped to selectedPortId */}
            <div className="bg-glass backdrop-blur-3xl rounded-2xl border border-glass-border p-6 flex flex-col shrink-0 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-sm uppercase tracking-[0.12em] text-text-primary flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan" /> Inspector Node
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-glass-border text-cyan">
                  {selectedPort.name} [{selectedPort.code}]
                </span>
              </div>
              <div className="min-h-[120px]">
                {isLoading ? (
                  <div className="flex flex-col gap-3 animate-pulse">
                    <div className="h-3 bg-glass rounded w-3/4"></div>
                    <div className="h-3 bg-glass rounded w-full"></div>
                    <div className="h-3 bg-glass rounded w-5/6"></div>
                  </div>
                ) : error ? (
                  <div className="h-[120px] flex flex-col items-center justify-center text-center p-4 border border-danger/30 bg-danger/5 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-danger mb-2" />
                    <span className="text-xs font-mono text-danger mb-3">{error}</span>
                    <button
                      onClick={loadData}
                      className="px-3 py-1 bg-surface border border-glass-border text-xs rounded hover:bg-glass flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                ) : selectedAnomaly ? (
                  <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-glass-border pb-2">
                      <span className="font-display font-medium text-xs text-text-primary uppercase tracking-wider">
                        {selectedAnomaly.label}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted">
                        PORT ID: {selectedAnomaly.portId || selectedPortId}
                      </span>
                    </div>
                    <div className="border-l-2 border-cyan pl-4 py-1">
                      <p className="text-text-primary font-mono text-xs leading-relaxed uppercase opacity-90">
                        {selectedAnomaly.explanation || 'Anomaly requires manual review. Automated analysis pending deeper scanning operations.'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-glass rounded-xl p-4 backdrop-blur-md border border-glass-border flex flex-col gap-1">
                        <div className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Confidence</div>
                        <div className="text-text-primary font-mono text-2xl font-light">{selectedAnomaly.confidence}%</div>
                      </div>
                      <div className="bg-glass rounded-xl p-4 backdrop-blur-md border border-glass-border flex flex-col gap-1">
                        <div className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Depth</div>
                        <div className="text-text-primary font-mono text-2xl font-light">
                          {selectedAnomaly.depthMeters !== null ? `${selectedAnomaly.depthMeters}m` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : portAnomalies.length === 0 ? (
                  <div className="h-[120px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-glass-border bg-glass rounded-xl">
                    <CheckCircle className="w-6 h-6 text-success mb-2 opacity-80" />
                    <span className="text-xs font-mono text-text-secondary uppercase">
                      No anomalies detected for {selectedPort.name}.
                    </span>
                  </div>
                ) : (
                  <div className="h-[120px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-glass-border bg-glass rounded-xl">
                    <Anchor className="w-6 h-6 text-text-muted mb-3" />
                    <span className="text-xs font-mono text-text-secondary uppercase">
                      Select an anomaly in {selectedPort.name} to inspect.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Active Queue: Filtered strictly to selectedPort */}
            <div className="flex-1 min-h-0 bg-glass backdrop-blur-3xl rounded-2xl border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col">
              <PriorityQueue
                anomalies={priorityAnomalies}
                selectedId={selectedAnomalyId}
                isLoading={isLoading}
                onSelectAnomaly={id => {
                  const target = portAnomalies.find(a => a.id === id);
                  if (target) selectAnomaly(target);
                }}
                onViewDetails={id => navigate(`/map?port=${selectedPortId}`, { state: { selectedAnomalyId: id } })}
              />
            </div>

            {/* Learning Pipeline */}
            <div className="shrink-0 bg-glass backdrop-blur-3xl rounded-2xl border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
              <ActiveLearningWidget
                currentModel={modelFeedback?.currentModel || { name: 'S.A.G.A.R. v1', accuracy: 0, lastUpdated: '' }}
                feedbackSamples={modelFeedback?.feedbackSamples || 0}
                potentialRetrainingSet={modelFeedback?.potentialRetrainingSet || 0}
                nextModel={modelFeedback?.nextModel || { name: 'S.A.G.A.R. v2', accuracy: 0, estimatedTime: '' }}
                isLoading={isLoading}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
