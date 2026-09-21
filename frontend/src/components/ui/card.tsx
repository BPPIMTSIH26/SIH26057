import React from 'react';

export const Card = ({ className = '', children, ...props }: any) => (
  <div className={`rounded-xl border bg-glass border-glass-border shadow-sm overflow-hidden ${className}`} {...props}>{children}</div>
);

export const CardHeader = ({ className = '', children, ...props }: any) => (
  <div className={`flex flex-col space-y-1.5 p-6 border-b border-glass-border/50 bg-white/5 ${className}`} {...props}>{children}</div>
);

export const CardTitle = ({ className = '', children, ...props }: any) => (
  <h3 className={`font-semibold leading-none tracking-tight ${className}`} {...props}>{children}</h3>
);

export const CardDescription = ({ className = '', children, ...props }: any) => (
  <p className={`text-sm text-text-muted ${className}`} {...props}>{children}</p>
);

export const CardContent = ({ className = '', children, ...props }: any) => (
  <div className={`p-6 ${className}`} {...props}>{children}</div>
);
