import React from 'react';
import { Shield, Lock, Trash2, Globe, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg-main text-text-main p-8 pt-24 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-accent mx-auto" />
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-text-muted">Effective Date: 2026-09-21 | Last Updated: 2026-09-21</p>
        </div>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Lock className="w-5 h-5 text-accent" />
              1. What Data We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-text-secondary">
            <p><strong>Account Data:</strong> We collect only the username and password hashes required for Role-Based Access Control (RBAC). No real names, emails, or personal identifiers are stored.</p>
            <p><strong>Sonar Data:</strong> We collect uploaded `.sl2`, `.xtf`, `.json`, and image files (PNG/JPG/TIFF) alongside their geospatial metadata (latitude, longitude, depth, timestamp).</p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              2. Why We Process Your Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-text-secondary">
            <p>Data is processed strictly for the purpose of demonstrating the AI-Powered Automated Underwater Marine Debris and Anomaly Detection System (SIH26057).</p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-accent" />
              3. Data Retention and Deletion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-text-secondary">
            <p><strong>Retention:</strong> Demo uploads and cached inferences are retained for a maximum of 24 hours.</p>
            <p><strong>Deletion:</strong> Uploads are automatically purged from the temporary local file system. Users can request immediate deletion by utilizing the `demo:reset` capabilities of the system.</p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Globe className="w-5 h-5 text-accent" />
              4. Third-Party Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-text-secondary">
            <p>The system interacts with Hugging Face (`narayan-nkj/sagar-sss`) strictly to download public datasets and pre-trained model weights. <strong>No uploaded user survey data is ever sent to Hugging Face or any other third-party service.</strong></p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              5. Prototype Security Limitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-text-secondary">
            <p>This is a software prototype built for the Smart India Hackathon. It utilizes local SQLite persistence and mock authentication guards. Do not upload classified, official, or highly sensitive military sonar logs to this demonstration environment.</p>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              6. Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-text-secondary">
            <p>For data correction or deletion requests, please contact Team Orion (ID: BPPIMTSIH26).</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
