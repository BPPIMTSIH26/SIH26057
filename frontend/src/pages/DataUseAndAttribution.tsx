import React from 'react';
import { Database, Copyright } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function DataUseAndAttribution() {
  return (
    <div className="min-h-screen bg-bg-main text-text-main p-8 pt-24 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Database className="w-16 h-16 text-accent mx-auto" />
          <h1 className="text-4xl font-bold tracking-tight">Data Use & Attribution</h1>
        </div>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Copyright className="w-5 h-5 text-accent" />
              1. Dataset Attribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-text-secondary">
            <p>The primary dataset powering S.A.G.A.R.'s detection model is hosted on Hugging Face:</p>
            <p className="font-mono bg-bg-main p-2 rounded text-sm text-accent">narayan-nkj/sagar-sss</p>
            <p>This dataset consists of 5,205 tiles (3,875 train, 630 val, 700 test) representing synthetic and real side-scan sonar returns.</p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl">2. License Obligations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-text-secondary">
            <p>The `narayan-nkj/sagar-sss` dataset and associated model checkpoints are distributed under the <strong>Creative Commons Attribution-ShareAlike 4.0 International (CC-BY-SA-4.0)</strong> license.</p>
            <p>Any derivative works, model fine-tuning, or commercial adaptations must maintain this attribution and distribute contributions under the same license.</p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl">3. Limitations of Synthetic Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-text-secondary">
            <p>A portion of the ghost net and debris classes within the dataset are synthetic fixtures used to augment sparse real-world data. These synthetic inclusions may not perfectly model acoustic shadows, multi-path reflections, and heave/pitch/roll artefacts found in turbulent real-world environments.</p>
            <p>Consequently, the model's high precision/recall on the synthetic validation sets may suffer degradation when exposed to completely novel geological topologies (e.g., highly complex rock clusters mimicking cylinders).</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
