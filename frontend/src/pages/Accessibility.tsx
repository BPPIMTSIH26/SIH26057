import React from 'react';
import { Eye, Keyboard, Type } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function Accessibility() {
  return (
    <div className="min-h-screen bg-bg-main text-text-main p-8 pt-24 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Eye className="w-16 h-16 text-accent mx-auto" />
          <h1 className="text-4xl font-bold tracking-tight">Accessibility Statement</h1>
        </div>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-accent" />
              1. Keyboard Navigation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-text-secondary">
            <p>S.A.G.A.R. is designed to be fully navigable via keyboard. All interactive elements, including map controls, upload dropzones, and anomaly review forms, support sequential `Tab` navigation with visible focus states.</p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Type className="w-5 h-5 text-accent" />
              2. Screen Readers and Contrast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-text-secondary">
            <p>We strive to maintain WCAG 2.1 AA readable contrast across the dark-mode dashboard. Status badges (e.g., DEMO DATA, RESULT, LIVE RUN) include screen-reader accessible text. Form labels and error states are explicitly linked to their corresponding inputs.</p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl">3. Responsive Layout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-text-secondary">
            <p>The dashboard is optimized for laptop and projector resolutions, ensuring the MoES/NIOT jury can view the application clearly without horizontal scrolling or overlapping elements on standard presentation displays.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
