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
    <div className="fixed bottom-6 right-6 z-[9999] max-w-md bg-glass-strong border border-danger/60 text-text-primary p-4 rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-5 duration-300 flex items-start gap-3">
      <div className="p-2 bg-danger/20 rounded-lg shrink-0 mt-0.5 border border-danger/40">
        <ShieldAlert className="w-5 h-5 text-danger" />
      </div>
      <div className="flex-1 text-sm space-y-1">
        <div className="flex items-center justify-between font-bold text-danger">
          <span className="flex items-center gap-1.5 font-display">
            <Lock className="w-3.5 h-3.5" /> Copyright Protection Active
          </span>
          <button 
            onClick={onDismiss}
            className="text-text-muted hover:text-text-primary transition-colors p-0.5 rounded-md hover:bg-glass"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-text-secondary text-xs leading-relaxed">{warning.message}</p>
        <div className="pt-1 text-[10px] text-text-muted flex items-center gap-1 font-mono">
          <Copyright className="w-3 h-3 text-accent" />
          <span>2026 Team (ORION)⁶⁹ (SIH26057). All Rights Reserved.</span>
        </div>
      </div>
    </div>
  );
};

export const PersistentCopyrightFooterBadge: React.FC = () => {
  return (
    <div className="py-2.5 px-6 bg-glass backdrop-blur-3xl border-t border-glass-border text-xs text-text-muted flex flex-wrap items-center justify-between gap-3 select-none shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="font-semibold text-text-primary font-display">S.A.G.A.R. Maritime Portal</span>
        <span className="text-text-muted opacity-50">|</span>
        <span className="flex items-center gap-1 text-accent font-mono text-[11px]">
          <Lock className="w-3 h-3" /> PROPRIETARY & VIEW-ONLY
        </span>
      </div>
      <div className="flex items-center gap-4 text-[11px] font-mono">
        <Link 
          to="/copyright" 
          className="text-text-secondary hover:text-accent transition-colors flex items-center gap-1.5 font-medium hover:underline"
        >
          <Copyright className="w-3.5 h-3.5 text-accent" /> Copyright & License Notice
        </Link>
        <span className="text-text-muted opacity-40">•</span>
        <a 
          href="https://github.com/BPPIMTSIH26/SIH26057" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          Repo: SIH26057
        </a>
      </div>
    </div>
  );
};
