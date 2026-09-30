import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Lock, Copyright, X } from 'lucide-react';
import type { CopyWarningState } from '../hooks/useCopyProtection';

interface CopyrightBannerProps {
  warning: CopyWarningState;
  onDismiss: () => void;
}

export const CopyrightToast: React.FC<CopyrightBannerProps> = ({ warning, onDismiss }) => {
  if (!warning.show) return null;

  return (
    <div className="fixed bottom-12 right-6 z-[9999] max-w-sm bg-surface/95 border border-glass-border-strong text-text-primary p-3.5 rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 flex items-start gap-3 select-none">
      <div className="p-1.5 bg-glass rounded-lg shrink-0 mt-0.5 border border-glass-border">
        <ShieldAlert className="w-4 h-4 text-text-secondary" />
      </div>
      <div className="flex-1 text-xs space-y-1">
        <div className="flex items-center justify-between font-semibold text-text-primary">
          <span className="flex items-center gap-1.5 font-display text-xs">
            <Lock className="w-3 h-3 text-text-muted" /> Copyright Notice
          </span>
          <button 
            onClick={onDismiss}
            className="text-text-muted hover:text-text-primary transition-colors p-0.5 rounded hover:bg-glass"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-text-secondary text-[11px] leading-snug font-normal">{warning.message}</p>
        <div className="pt-1.5 text-[10px] text-text-muted flex items-center gap-1 font-mono border-t border-glass-border/40">
          <Copyright className="w-3 h-3 text-text-muted" />
          <span>2026 Team (ORION)⁶⁹ (SIH26057)</span>
        </div>
      </div>
    </div>
  );
};

export const PersistentCopyrightFooterBadge: React.FC = () => {
  return (
    <div className="py-1.5 px-6 bg-void/90 backdrop-blur-md border-t border-glass-border/40 text-[11px] text-text-muted flex flex-wrap items-center justify-between gap-3 select-none shrink-0 font-mono">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted/60" />
        <span className="font-medium text-text-secondary font-display">S.A.G.A.R. Maritime Portal</span>
        <span className="text-text-muted opacity-40">|</span>
        <span className="flex items-center gap-1 text-text-muted text-[10px]">
          <Lock className="w-3 h-3" /> PROPRIETARY & VIEW-ONLY
        </span>
      </div>
      <div className="flex items-center gap-4 text-[10px]">
        <Link 
          to="/copyright" 
          className="text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1 font-medium hover:underline"
        >
          <Copyright className="w-3 h-3" /> Copyright & License Notice
        </Link>
        <span className="text-text-muted opacity-30">•</span>
        <a 
          href="https://github.com/BPPIMTSIH26/SIH26057" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-text-muted hover:text-text-secondary transition-colors"
        >
          Repo: SIH26057
        </a>
      </div>
    </div>
  );
};
