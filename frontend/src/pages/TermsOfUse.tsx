import React from 'react';
import { AlertCircle, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-bg-main text-text-main p-8 pt-24 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Scale className="w-16 h-16 text-accent mx-auto" />
          <h1 className="text-4xl font-bold tracking-tight">Terms of Use</h1>
          <p className="text-text-muted">Effective Date: 2026-09-21</p>
        </div>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl">1. Prototype Status</CardTitle>
          </CardHeader>
          <CardContent className="text-text-secondary">
            <p>This software is a demonstrable prototype developed for the Smart India Hackathon (SIH26057). It is not a production-grade maritime navigation system.</p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-red-500/50 text-text-main">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              2. No Guarantee of Navigational Safety
            </CardTitle>
          </CardHeader>
          <CardContent className="text-text-secondary">
            <p className="font-semibold text-red-400">WARNING:</p>
            <p>The predictions, anomaly detections, and geospatial boundaries rendered by S.A.G.A.R. carry NO guarantee of accuracy. This system must NOT be used for safety-critical decisions, maritime vessel navigation, hazard avoidance, or emergency response operations.</p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl">3. Human Verification Requirement</CardTitle>
          </CardHeader>
          <CardContent className="text-text-secondary">
            <p>All automated detections of marine debris, shipwrecks, and synthetic anomalies must be rigorously verified by a trained human operator. The system explicitly supports a Human Review workflow to override or confirm AI predictions.</p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl">4. Acceptable Use</CardTitle>
          </CardHeader>
          <CardContent className="text-text-secondary">
            <p>Users agree to use this platform strictly for evaluation, testing, and Hackathon demonstration purposes. Malicious file uploads, unauthorized penetration testing, or attempts to extract the dataset binaries without attribution are prohibited.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
