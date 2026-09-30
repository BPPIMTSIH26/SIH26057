import React from 'react';
import { ShieldAlert, Lock, Copyright, X } from 'lucide-react';
import type { CopyWarningState } from '../hooks/useCopyProtection';

interface CopyrightBannerProps {
  warning: CopyWarningState;
  onDismiss: () => void;
}

export const CopyrightToast: React.FC<CopyrightBannerProps> = ({ warning, onDismiss }) => {
  if (!warning.show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-md bg-slate-950/95 border border-red-500/60 text-white p-4 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300 flex items-start gap-3">
      <div className="p-2 bg-red-500/20 rounded-lg shrink-0 mt-0.5 border border-red-500/30">
        <ShieldAlert className="w-5 h-5 text-red-400" />
      </div>
      <div className="flex-1 text-sm space-y-1">
        <div className="flex items-center justify-between font-bold text-red-400">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Copyright Protection Active
          </span>
          <button 
            onClick={onDismiss}
            className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-md hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-slate-300 text-xs leading-relaxed">{warning.message}</p>
        <div className="pt-1 text-[10px] text-slate-400 flex items-center gap-1">
          <Copyright className="w-3 h-3 text-cyan-400" />
          <span>2026 Team NetraSonar (SIH26057). All Rights Reserved.</span>
        </div>
      </div>
    </div>
  );
};

export const PersistentCopyrightFooterBadge: React.FC = () => {
  return (
    <div className="py-2 px-4 bg-slate-900/80 border-t border-cyan-900/30 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 select-none">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-semibold text-slate-300">S.A.G.A.R. Maritime Portal</span>
        <span className="text-slate-500">|</span>
        <span className="flex items-center gap-1 text-cyan-400 font-mono text-[11px]">
          <Lock className="w-3 h-3" /> PROPRIETARY & VIEW-ONLY
        </span>
      </div>
      <div className="flex items-center gap-4 text-[11px]">
        <a 
          href="/copyright" 
          className="hover:text-cyan-300 transition-colors flex items-center gap-1 font-medium"
        >
          <Copyright className="w-3 h-3" /> Copyright & License Notice
        </a>
        <span className="text-slate-600">•</span>
        <a 
          href="https://github.com/BPPIMTSIH26/SIH26057" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-cyan-300 transition-colors"
        >
          Repo: SIH26057
        </a>
      </div>
    </div>
  );
};
