import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft } from 'lucide-react';

interface PageCloseButtonProps {
  to?: string;
  label?: string;
  variant?: 'floating' | 'inline' | 'header';
  className?: string;
}

export const PageCloseButton: React.FC<PageCloseButtonProps> = ({
  to,
  label = 'Close',
  variant = 'floating',
  className = ''
}) => {
  const navigate = useNavigate();

  const handleClose = () => {
    if (to) {
      navigate(to);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [to]);

  if (variant === 'inline') {
    return (
      <button
        onClick={handleClose}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-medium rounded-xl bg-glass border border-glass-border text-text-secondary hover:text-accent hover:bg-accent/15 hover:border-accent/40 transition-colors duration-200 cursor-pointer shadow-none ${className}`}
        title="Close this page (Esc)"
        type="button"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>
    );
  }

  if (variant === 'header') {
    return (
      <button
        onClick={handleClose}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-xl bg-glass border border-glass-border text-text-secondary hover:text-accent hover:bg-accent/15 hover:border-accent/40 transition-colors duration-200 cursor-pointer shadow-none ${className}`}
        title="Close page (Esc)"
        type="button"
      >
        <X className="w-4 h-4 text-text-muted group-hover:text-accent" />
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClose}
      className={`absolute top-4 right-4 sm:top-6 sm:right-8 z-30 flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-medium rounded-xl bg-surface/90 border border-glass-border-strong text-text-secondary hover:text-accent hover:bg-accent/15 hover:border-accent/40 backdrop-blur-xl shadow-none transition-colors duration-200 group cursor-pointer active:scale-95 ${className}`}
      title="Close page (Esc)"
      type="button"
    >
      <span className="font-sans text-[11px] font-medium tracking-wide">
        {label}
      </span>
      <div className="p-0.5 rounded-md bg-glass border border-glass-border group-hover:border-accent/40 transition-colors">
        <X className="w-3.5 h-3.5" />
      </div>
    </button>
  );
};

export default PageCloseButton;
