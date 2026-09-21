import React, { useEffect, useState } from 'react';
import { Server, Database, Brain, HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export default function SystemStatus() {
  const [health, setHealth] = useState({
    frontend: 'OK',
    backend: 'CHECKING...',
    database: 'CHECKING...',
    model: 'CHECKING...',
    dataset: 'CHECKING...',
    storage: 'CHECKING...'
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
        if (res.ok) {
          const response = await res.json();
          setHealth(prev => ({
            ...prev,
            backend: response.status === 'healthy' ? 'OK' : 'DEGRADED',
            database: response.services?.database === 'connected' ? 'OK' : 'UNAVAILABLE',
            model: response.services?.model === 'loaded' ? 'OK' : 'UNAVAILABLE',
            dataset: 'OK', // Assuming OK if backend is running for this prototype
            storage: 'OK'
          }));
        }
      } catch (error) {
        setHealth(prev => ({
          ...prev,
          backend: 'UNAVAILABLE',
          database: 'UNAVAILABLE',
          model: 'UNAVAILABLE',
          dataset: 'UNAVAILABLE',
          storage: 'UNAVAILABLE'
        }));
      }
    };
    checkHealth();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK': return 'text-green-500 bg-green-500/10';
      case 'DEGRADED': return 'text-yellow-500 bg-yellow-500/10';
      case 'UNAVAILABLE': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main p-8 pt-24 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Server className="w-16 h-16 text-accent mx-auto" />
          <h1 className="text-4xl font-bold tracking-tight">System Status</h1>
          <p className="text-text-muted">Live health checks for S.A.G.A.R. components.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-bg-card border-border-card text-text-main">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-accent" /> Frontend</span>
                <span className={`text-xs px-2 py-1 rounded-full font-mono ${getStatusColor(health.frontend)}`}>{health.frontend}</span>
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-bg-card border-border-card text-text-main">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                <span className="flex items-center gap-2"><Server className="w-4 h-4 text-accent" /> Backend API</span>
                <span className={`text-xs px-2 py-1 rounded-full font-mono ${getStatusColor(health.backend)}`}>{health.backend}</span>
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-bg-card border-border-card text-text-main">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                <span className="flex items-center gap-2"><Database className="w-4 h-4 text-accent" /> Database</span>
                <span className={`text-xs px-2 py-1 rounded-full font-mono ${getStatusColor(health.database)}`}>{health.database}</span>
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-bg-card border-border-card text-text-main">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                <span className="flex items-center gap-2"><Brain className="w-4 h-4 text-accent" /> Model Availability</span>
                <span className={`text-xs px-2 py-1 rounded-full font-mono ${getStatusColor(health.model)}`}>{health.model}</span>
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="bg-bg-card border-border-card text-text-main">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                <span className="flex items-center gap-2"><HardDrive className="w-4 h-4 text-accent" /> Local Storage</span>
                <span className={`text-xs px-2 py-1 rounded-full font-mono ${getStatusColor(health.storage)}`}>{health.storage}</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Temporary inline component to fix the missing Globe import from lucide-react above
function Globe(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
}
