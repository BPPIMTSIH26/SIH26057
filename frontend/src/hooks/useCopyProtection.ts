import { useEffect, useState } from 'react';

export interface CopyWarningState {
  show: boolean;
  message: string;
  timestamp: number;
}

export function useCopyProtection(enabled: boolean = true) {
  const [warning, setWarning] = useState<CopyWarningState>({
    show: false,
    message: '',
    timestamp: 0,
  });

  const triggerWarning = (msg: string) => {
    const now = Date.now();
    setWarning({
      show: true,
      message: msg,
      timestamp: now,
    });
    // Auto-dismiss after 3.0 seconds with smooth animation
    setTimeout(() => {
      setWarning(prev => (prev.timestamp === now ? { ...prev, show: false } : prev));
    }, 3000);
  };

  const dismissWarning = () => {
    setWarning(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    if (!enabled) return;

    // 1. Block Context Menu (Right-click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerWarning('Right-click disabled: S.A.G.A.R. source materials, imagery, and code are protected under Copyright License (SIH26057).');
    };

    // 2. Block Keyboard Copy/Inspect Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Block Ctrl+C, Cmd+C (Copy)
      if (isCmdOrCtrl && key === 'c') {
        // Allow selection inside normal text inputs if explicitly needed, but block generally
        const target = e.target as HTMLElement;
        const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        if (!isInputField) {
          e.preventDefault();
          triggerWarning('Copying content is disabled: All S.A.G.A.R. code, datasets, and analytics are All Rights Reserved.');
        }
      }

      // Block Ctrl+X, Cmd+X (Cut)
      if (isCmdOrCtrl && key === 'x') {
        const target = e.target as HTMLElement;
        const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        if (!isInputField) {
          e.preventDefault();
          triggerWarning('Cut action disabled: Protected under S.A.G.A.R. Copyright Terms.');
        }
      }

      // Block Ctrl+S, Cmd+S (Save Page)
      if (isCmdOrCtrl && key === 's') {
        e.preventDefault();
        triggerWarning('Saving page disabled: Offline copying or downloading of S.A.G.A.R. system is strictly prohibited.');
      }

      // Block Ctrl+U, Cmd+U (View Source)
      if (isCmdOrCtrl && key === 'u') {
        e.preventDefault();
        triggerWarning('Viewing page source code is prohibited under S.A.G.A.R. Proprietary License.');
      }

      // Block F12, Ctrl+Shift+I, Cmd+Opt+I (Developer Tools)
      if (e.key === 'F12' || (isCmdOrCtrl && e.shiftKey && key === 'i') || (e.metaKey && e.altKey && key === 'i')) {
        // Inform user about inspect blocking policy
        triggerWarning('Developer Tools & Code Inspection Notice: S.A.G.A.R. (SIH26057) is proprietary non-copyable software.');
      }

      // Block Ctrl+P, Cmd+P (Print)
      if (isCmdOrCtrl && key === 'p') {
        e.preventDefault();
        triggerWarning('Printing disabled: Reproduction of S.A.G.A.R. screens and datasets is restricted.');
      }
    };

    // 3. Block Drag and Drop of Images and Canvas Elements
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.tagName === 'CANVAS' || target.tagName === 'SVG') {
        e.preventDefault();
        triggerWarning('Asset dragging disabled: Images and sonar charts are copyrighted property of Team (ORION)⁶⁹.');
      }
    };

    // 4. Block Selection Copy Event directly
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (!isInputField) {
        e.preventDefault();
        if (e.clipboardData) {
          e.clipboardData.setData(
            'text/plain',
            'S.A.G.A.R. (Sub-surface Anomaly Grid & Analysis Repository) - Copyright (c) 2026 Team (ORION)⁶⁹ (SIH26057). All Rights Reserved. Unauthorized copying is prohibited. Visit https://github.com/BPPIMTSIH26/SIH26057'
          );
        }
        triggerWarning('Selection copied with Copyright Notice watermark. Copying source code is prohibited.');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('copy', handleCopy);
    };
  }, [enabled]);

  return { warning, dismissWarning, triggerWarning };
}
