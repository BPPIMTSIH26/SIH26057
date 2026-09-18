import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Layers, 
  Trash2,
  Sliders,
  Columns,
  Sparkles,
  Eye,
  Activity
} from 'lucide-react';
import { imageProcessingApi, ImageProcessingJobResponse } from '../services/imageProcessingApi';

const ImageProcessing: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<ImageProcessingJobResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ImageProcessingJobResponse[]>([]);
  
  // Viewer modes: 'side-by-side' | 'slider' | 'enhanced'
  const [viewMode, setViewMode] = useState<'side-by-side' | 'slider' | 'enhanced'>('side-by-side');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [showMaskOverlay, setShowMaskOverlay] = useState<boolean>(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [imgKey, setImgKey] = useState<number>(() => Date.now());
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const fetchHistory = useCallback(async () => {
    try {
      const data = await imageProcessingApi.getJobHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDeleteJob = async (id: string) => {
    try {
      await imageProcessingApi.deleteJob(id);
      if (jobId === id) {
        setJobId(null);
        setResult(null);
      }
      fetchHistory();
    } catch (err) {
      console.error('Failed to delete job', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setJobId(null);
      setError(null);
      setFailedImages({});
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setFailedImages({});
    try {
      const { jobId } = await imageProcessingApi.createJob(file) as any;
      setJobId(jobId);
    } catch (err: any) {
      setError(err.message || 'Failed to start processing');
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (jobId && isProcessing) {
      interval = setInterval(async () => {
        try {
          const status = await imageProcessingApi.getJobStatus(jobId);
          setResult(status);
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'assessed') {
            setIsProcessing(false);
            clearInterval(interval);
            setImgKey(Date.now());
            fetchHistory();
          }
        } catch (err: any) {
          setError(err.message || 'Failed to fetch status');
          setIsProcessing(false);
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [jobId, isProcessing, fetchHistory]);

  const getMediaUrl = (path?: string) => {
    if (!path) return '';
    return `${path}?t=${imgKey}`;
  };

  // Slider dragging logic
  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPos(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingSlider && e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider) {
      handleSliderMove(e.clientX);
    }
  };

  return (
    <div 
      className="flex-1 overflow-y-auto p-6 space-y-6"
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDraggingSlider(false)}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDraggingSlider(false)}
    >
      <div className="flex flex-col mb-4">
        <h1 className="text-2xl font-display text-text-primary tracking-wide flex items-center gap-2">
          <span>Image Processing & Swath Enhancement</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full border border-cyan/30 bg-cyan/10 text-cyan font-mono">v1.1</span>
        </h1>
        <p className="text-sm text-text-muted mt-1">Pre-process, assess, denoise, and enhance side-scan sonar waterfall imagery with CLAHE and robust normalization.</p>
        <div className="mt-2 text-xs font-mono flex items-center gap-2">
          <span>Pipeline Status:</span>
          <span className={result?.status === 'completed' ? 'text-success font-semibold flex items-center gap-1' : result?.status === 'failed' ? 'text-danger font-semibold' : isProcessing ? 'text-accent font-semibold animate-pulse' : 'text-text-muted'}>
            {result?.status ? result.status.toUpperCase() : (file ? 'READY TO ENHANCE' : 'WAITING FOR FILE')}
            {result?.status === 'completed' && <CheckCircle className="w-3.5 h-3.5 inline" />}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload & Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-glass border border-glass-border rounded-xl p-5 shadow-lg">
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-accent" /> Upload Sonar Image
            </h2>
            <div className="border-2 border-dashed border-glass-border-strong rounded-lg p-6 text-center hover:bg-glass-strong transition-colors">
              <input type="file" id="sonar-upload" className="hidden" accept="image/png, image/jpeg, image/tiff" onChange={handleFileChange} />
              <label htmlFor="sonar-upload" className="cursor-pointer flex flex-col items-center">
                <ImageIcon className="w-8 h-8 text-text-muted mb-2" />
                <span className="text-sm text-text-primary">Click or drag file here</span>
                <span className="text-xs text-text-muted mt-1">Supported: PNG, JPG, TIFF (High-Res Swaths)</span>
              </label>
            </div>
            {file && (
              <div className="mt-4 p-3 bg-glass-strong rounded-lg flex justify-between items-center text-xs text-text-muted border border-glass-border">
                <span className="truncate max-w-[170px] font-mono text-text-primary">{file.name}</span>
                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}
            <div className="mt-4">
              <button 
                onClick={handleProcess} 
                disabled={!file || isProcessing}
                className="w-full bg-accent text-void py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isProcessing ? 'Enhancing Sonar Imagery...' : 'Process Sonar Image'}
              </button>
            </div>
            {error && <div className="mt-4 text-xs text-danger flex items-center gap-2 p-2 bg-danger/10 border border-danger/20 rounded-md"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}
          </div>

          {/* Progress panel */}
          {isProcessing && result && (
            <div className="bg-glass border border-glass-border rounded-xl p-5 shadow-lg">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent animate-pulse" /> Processing Pipeline
              </h3>
              <div className="w-full bg-glass-strong rounded-full h-2 mt-4 overflow-hidden border border-glass-border">
                <div className="bg-accent h-2 rounded-full transition-all duration-500" style={{ width: `${result.progress}%` }}></div>
              </div>
              <div className="text-xs text-text-muted mt-2 uppercase text-right font-mono">{result.stage} ({result.progress}%)</div>
            </div>
          )}

          {/* Quality Panel */}
          {result && (result.status === 'completed' || result.status === 'assessed') && result.qualityAssessment && (
            <div className="bg-glass border border-glass-border rounded-xl p-5 shadow-lg flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" /> Quality Assessment
                </h3>
                <div className="space-y-3 text-xs text-text-muted">
                  <div className="flex justify-between items-center py-1 border-b border-glass-border/50">
                    <span>Overall Score:</span> 
                    <span className="text-text-primary font-mono font-semibold px-2 py-0.5 rounded bg-glass-strong">{result.qualityAssessment.overallScore}/100</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-glass-border/50">
                    <span>Category:</span> 
                    <span className="text-success font-mono uppercase font-semibold">{result.qualityAssessment.category}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-glass-border/50">
                    <span>Speckle Noise:</span> 
                    <span className="text-text-primary font-mono capitalize">{result.qualityAssessment.speckleNoise}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-glass-border/50">
                    <span>Data Dropout:</span> 
                    <span className="text-text-primary font-mono">{result.qualityAssessment.dataDropoutPercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-glass-border/50">
                    <span>Image Coverage:</span> 
                    <span className="text-text-primary font-mono">{result.qualityAssessment.imageCoveragePercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-glass-border/50">
                    <span>Shadow Visibility:</span> 
                    <span className="text-text-primary font-mono capitalize">{result.qualityAssessment.shadowVisibility}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-glass-border/50">
                    <span>Missing Region:</span> 
                    <span className="text-text-primary font-mono">{result.qualityAssessment.missingRegionPercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Contrast Score (std):</span> 
                    <span className="text-text-primary font-mono">{result.qualityAssessment.contrastScore}</span>
                  </div>
                </div>
                {result.qualityAssessment.warnings?.length > 0 && (
                  <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-xs text-danger">
                    <strong>Warnings:</strong> {result.qualityAssessment.warnings.join(', ')}
                  </div>
                )}
              </div>

              {result.metadata && (
                <div className="pt-3 border-t border-glass-border text-xs text-text-muted space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Dimensions:</span>
                    <span className="text-text-primary">{result.metadata.originalWidth} × {result.metadata.originalHeight} px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enhancement:</span>
                    <span className="text-accent">{result.metadata.contrastMethod || 'CLAHE'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Viewer */}
        <div className="lg:col-span-2 space-y-6">
          {result && (result.status === 'completed' || result.status === 'assessed') ? (
            <>
              {/* Image Viewer Card */}
              <div className="bg-glass border border-glass-border rounded-xl p-5 shadow-lg">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Processed Results</h2>
                      <p className="text-xs text-text-muted mt-0.5">High-fidelity contrast enhancement preserving original swath aspect ratio</p>
                    </div>

                    {/* Viewer mode switchers */}
                    <div className="flex items-center bg-void/80 border border-glass-border rounded-lg p-1 gap-1 self-start sm:self-auto">
                      <button
                        onClick={() => setViewMode('side-by-side')}
                        className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'side-by-side' ? 'bg-accent text-void font-medium shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                        title="Side by Side comparison"
                      >
                        <Columns className="w-3.5 h-3.5" />
                        <span>Side-by-Side</span>
                      </button>
                      <button
                        onClick={() => setViewMode('slider')}
                        className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'slider' ? 'bg-accent text-void font-medium shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                        title="Before/After Split Slider"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Split Wipe</span>
                      </button>
                      <button
                        onClick={() => setViewMode('enhanced')}
                        className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'enhanced' ? 'bg-accent text-void font-medium shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                        title="Full-Swath Enhanced Focus"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Enhanced Focus</span>
                      </button>
                    </div>
                 </div>

                 {/* View Mode 1: Side by Side */}
                 {viewMode === 'side-by-side' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Original */}
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-text-muted flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-text-muted/60"></span>
                            Raw Original Sonar
                          </span>
                          <span className="text-[10px] font-mono text-text-muted">Unprocessed</span>
                        </div>
                        <div className="border border-glass-border rounded-lg overflow-x-auto overflow-y-hidden min-h-[220px] max-h-[360px] flex items-center justify-center bg-void/80 p-2 relative group">
                          {result.originalImageUrl && !failedImages['orig'] ? (
                            <img 
                              src={getMediaUrl(result.originalImageUrl)} 
                              alt="Original Sonar" 
                              className="max-w-full max-h-[340px] object-contain rounded transition-all"
                              onError={() => setFailedImages(prev => ({ ...prev, orig: true }))}
                            />
                          ) : (
                            <div className="text-xs text-text-muted flex flex-col items-center">
                              <AlertTriangle className="w-5 h-5 text-warning mb-1" />
                              <span>Image unavailable</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cleaned & Enhanced */}
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-accent flex items-center gap-1.5 font-medium">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                            Cleaned & Enhanced
                          </span>
                          <span className="text-[10px] font-mono text-success px-1.5 py-0.5 rounded bg-success/10 border border-success/30">CLAHE + Denoised</span>
                        </div>
                        <div className="border border-cyan/40 shadow-[0_0_15px_rgba(103,232,249,0.08)] rounded-lg overflow-x-auto overflow-y-hidden min-h-[220px] max-h-[360px] flex items-center justify-center bg-void/80 p-2 relative group">
                          {result.processedImageUrl && !failedImages['proc'] ? (
                            <img 
                              src={getMediaUrl(result.processedImageUrl)} 
                              alt="Cleaned and Enhanced Sonar" 
                              className="max-w-full max-h-[340px] object-contain rounded transition-all"
                              onError={() => setFailedImages(prev => ({ ...prev, proc: true }))}
                            />
                          ) : (
                            <div className="text-xs text-text-muted flex flex-col items-center">
                              <AlertTriangle className="w-5 h-5 text-warning mb-1" />
                              <span>Processed image loading...</span>
                              <button 
                                onClick={() => setImgKey(Date.now())}
                                className="mt-2 text-[10px] px-2 py-1 bg-glass-strong rounded border border-glass-border text-accent cursor-pointer"
                              >
                                Retry Loading
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                   </div>
                 )}

                 {/* View Mode 2: Split Slider */}
                 {viewMode === 'slider' && result.originalImageUrl && result.processedImageUrl && (
                   <div className="flex flex-col">
                     <div className="flex justify-between items-center text-xs text-text-muted mb-2 font-mono">
                       <span className="text-text-secondary">◄ Raw Original ({Math.round(sliderPos)}%)</span>
                       <span className="text-accent">Cleaned & Enhanced ({Math.round(100 - sliderPos)}%) ►</span>
                     </div>
                     <div 
                       ref={sliderContainerRef}
                       className="border border-glass-border rounded-lg overflow-hidden min-h-[260px] max-h-[400px] flex items-center justify-center bg-void/80 p-2 relative select-none cursor-ew-resize"
                       onMouseDown={(e) => {
                         setIsDraggingSlider(true);
                         handleSliderMove(e.clientX);
                       }}
                       onTouchStart={(e) => {
                         setIsDraggingSlider(true);
                         if (e.touches[0]) handleSliderMove(e.touches[0].clientX);
                       }}
                     >
                       {/* Enhanced Image (Base layer) */}
                       <img 
                         src={getMediaUrl(result.processedImageUrl)} 
                         alt="Enhanced Sonar" 
                         className="max-w-full max-h-[380px] object-contain select-none pointer-events-none"
                       />

                       {/* Original Image (Clipped overlay) */}
                       <div 
                         className="absolute inset-0 overflow-hidden flex items-center justify-center p-2"
                         style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
                       >
                         <img 
                           src={getMediaUrl(result.originalImageUrl)} 
                           alt="Original Sonar" 
                           className="max-w-full max-h-[380px] object-contain select-none pointer-events-none"
                         />
                       </div>

                       {/* Divider Line & Knob */}
                       <div 
                         className="absolute top-0 bottom-0 w-0.5 bg-accent shadow-[0_0_10px_#7dd3fc] pointer-events-none"
                         style={{ left: `${sliderPos}%` }}
                       >
                         <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-accent text-void flex items-center justify-center shadow-lg border-2 border-void text-[10px] font-bold">
                           ↔
                         </div>
                       </div>
                     </div>
                     <p className="text-[11px] text-text-muted text-center mt-2">Click and drag horizontally across the image to wipe between raw input and enhanced output.</p>
                   </div>
                 )}

                 {/* View Mode 3: Enhanced Focus with Mask Toggle */}
                 {viewMode === 'enhanced' && result.processedImageUrl && (
                   <div className="flex flex-col">
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-mono text-accent font-medium">Cleaned & Enhanced Focus (Full Swath)</span>
                       <div className="flex items-center gap-3">
                         <label className="text-xs text-text-muted flex items-center gap-1.5 cursor-pointer select-none">
                           <input 
                             type="checkbox" 
                             checked={showMaskOverlay} 
                             onChange={(e) => setShowMaskOverlay(e.target.checked)}
                             className="rounded border-glass-border text-accent focus:ring-0 cursor-pointer"
                           />
                           <span>Show Mask Overlay</span>
                         </label>
                       </div>
                     </div>
                     <div className="border border-cyan/40 rounded-lg overflow-x-auto min-h-[260px] max-h-[420px] flex items-center justify-center bg-void/80 p-2 relative">
                       <img 
                         src={getMediaUrl(result.processedImageUrl)} 
                         alt="Enhanced Sonar Focus" 
                         className="max-w-full max-h-[400px] object-contain rounded"
                       />
                       {showMaskOverlay && result.qualityMaskUrl && (
                         <img 
                           src={getMediaUrl(result.qualityMaskUrl)} 
                           alt="Quality Mask Overlay" 
                           className="max-w-full max-h-[400px] object-contain absolute inset-0 m-auto mix-blend-screen opacity-70 pointer-events-none"
                         />
                       )}
                     </div>
                   </div>
                 )}
                 
                 {/* Quality Mask Section */}
                 <div className="mt-6 border-t border-glass-border pt-5">
                    <h4 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-accent" /> Quality Mask & Segmented Swath Validation
                    </h4>
                    <p className="text-xs text-text-muted mb-3">Identifies usable sonar returns, acoustic shadows, and dropout areas across the genuine swath bounds to guide downstream detectors.</p>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 border border-glass-border rounded-lg overflow-x-auto min-h-[160px] max-h-[240px] flex items-center justify-center bg-void/80 p-2">
                        {result.qualityMaskUrl && !failedImages['qmask'] ? (
                          <img 
                            src={getMediaUrl(result.qualityMaskUrl)} 
                            alt="Quality Mask" 
                            className="max-w-full max-h-[220px] object-contain rounded"
                            onError={() => setFailedImages(prev => ({ ...prev, qmask: true }))}
                          />
                        ) : (
                          <div className="text-xs text-text-muted">Quality mask unavailable</div>
                        )}
                      </div>
                      <div className="w-full md:w-56 text-xs flex flex-col gap-2 p-3 bg-glass-strong rounded-lg border border-glass-border">
                        <div className="text-[11px] font-semibold uppercase text-text-muted tracking-wider mb-1">Mask Statistics</div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-sm"></span> Usable</span>
                          <span className="font-mono font-semibold text-text-primary">{result.maskStatistics?.usablePercentage.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Shadow</span>
                          <span className="font-mono font-semibold text-text-primary">{result.maskStatistics?.shadowPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> Missing/Sat</span>
                          <span className="font-mono font-semibold text-text-primary">{result.maskStatistics?.missingPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-500 rounded-sm"></span> Uncertain</span>
                          <span className="font-mono font-semibold text-text-primary">{result.maskStatistics?.uncertainPercentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* Actions / Downloads */}
                 <div className="mt-6 flex gap-3 flex-wrap pt-4 border-t border-glass-border">
                    {result.processedImageUrl && (
                      <a 
                        href={result.processedImageUrl} 
                        download={`cleaned_${result.jobId.split('-')[0]}.png`}
                        className="px-3.5 py-2 bg-accent/15 hover:bg-accent/25 text-accent rounded-lg text-xs font-medium border border-accent/40 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Cleaned Image
                      </a>
                    )}
                    {result.qualityMaskUrl && (
                      <a 
                        href={result.qualityMaskUrl} 
                        download={`mask_${result.jobId.split('-')[0]}.png`}
                        className="px-3.5 py-2 bg-glass-strong hover:bg-glass-stronger rounded-lg text-xs border border-glass-border flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Visual Mask
                      </a>
                    )}
                    {result.inferenceMaskUrl && (
                      <a 
                        href={result.inferenceMaskUrl} 
                        download={`infmask_${result.jobId.split('-')[0]}.png`}
                        className="px-3.5 py-2 bg-glass-strong hover:bg-glass-stronger rounded-lg text-xs border border-glass-border flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Binary Inference Mask
                      </a>
                    )}
                 </div>
              </div>

              {/* Shadow/Object analysis */}
              {result.regionAnalysis && result.regionAnalysis.length > 0 && (
                <div className="bg-glass border border-glass-border rounded-xl p-5 shadow-lg">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan" /> Feature & Acoustic Shadow Detections
                  </h3>
                  <div className="space-y-3">
                    {result.regionAnalysis.map(region => (
                      <div key={region.id} className="p-3 bg-glass-strong rounded-lg border border-glass-border text-xs flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                           <span className="font-mono text-accent font-semibold">{region.label.toUpperCase()}</span>
                           <span className="text-text-muted font-mono">Conf: {(region.objectConfidence * 100).toFixed(1)}% | Area: {Math.round(region.boundingBox.width)}×{Math.round(region.boundingBox.height)}px</span>
                        </div>
                        <p className="text-text-muted">{region.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-glass border border-glass-border rounded-xl p-5 shadow-lg h-full flex flex-col items-center justify-center text-center min-h-[350px]">
              <Layers className="w-12 h-12 text-glass-border-strong mb-4" />
              <h3 className="text-text-primary text-sm font-medium">Ready for Sonar Processing</h3>
              <p className="text-xs text-text-muted max-w-sm mt-2">Upload a side-scan sonar image or waterfall survey swath to begin pre-processing. The pipeline applies speckle reduction, adaptive CLAHE contrast enhancement, and pixel normalization.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Examples Gallery */}
      <div className="bg-glass border border-glass-border rounded-xl p-5 shadow-lg">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Previously Processed Sonar Examples</h2>
        {history.length > 0 ? (
          <div className="flex flex-col gap-3">
            {history.map((job) => (
              <div 
                key={job.jobId} 
                className={`flex items-center justify-between border rounded-lg p-3 bg-glass-strong transition-all cursor-pointer ${jobId === job.jobId ? 'border-accent shadow-[0_0_12px_rgba(125,211,252,0.15)]' : 'border-glass-border hover:border-cyan'}`} 
                onClick={() => {
                  setJobId(job.jobId);
                  setResult(job);
                  setImgKey(Date.now());
                  setFailedImages({});
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-12 bg-void/70 rounded flex items-center justify-center overflow-hidden shrink-0 border border-glass-border">
                    {job.processedImageUrl ? (
                      <img src={getMediaUrl(job.processedImageUrl)} alt="Processed" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-glass-border-strong" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-text-primary font-mono font-medium">Job ID: {job.jobId.split('-')[0]}</div>
                    <div className="text-[10px] capitalize font-semibold mt-1 flex items-center gap-2">
                      {job.status === 'completed' ? (
                        <span className="text-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>
                      ) : (
                        <span className="text-warning">{job.status}</span>
                      )}
                      {job.metadata && (
                        <span className="text-text-muted font-normal font-mono">• {job.metadata.originalWidth}×{job.metadata.originalHeight}px</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-accent font-medium hover:underline px-2 py-1">View Results</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteJob(job.jobId);
                    }}
                    className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors cursor-pointer"
                    title="Remove record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-10 border-2 border-dashed border-glass-border-strong rounded-lg">
            <p className="text-xs text-text-muted">No previously processed examples available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageProcessing;
