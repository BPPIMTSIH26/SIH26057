import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Copyright, 
  AlertTriangle, 
  FileText, 
  Scale, 
  Code2, 
  Globe, 
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function CopyrightLicense() {
  return (
    <div className="min-h-screen bg-void text-text-primary p-6 md:p-12 pt-20 md:pt-24 font-sans select-none">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Page Hero Header */}
        <div className="text-center space-y-4 relative">
          <div className="inline-flex items-center justify-center p-4 bg-glass border border-glass-border rounded-2xl mb-2 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <ShieldCheck className="w-12 h-12 text-accent" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-text-primary">
            Copyright & Proprietary License Notice
          </h1>
          <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto font-light">
            Official Intellectual Property Rights & Non-Copyable Usage Terms for S.A.G.A.R. (Sub-surface Anomaly Grid & Analysis Repository)
          </p>
          <div className="flex items-center justify-center gap-3 pt-2 text-xs font-mono">
            <span className="px-3 py-1 bg-danger/10 border border-danger/40 text-danger rounded-full font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> PROPRIETARY & ALL RIGHTS RESERVED
            </span>
            <span className="px-3 py-1 bg-glass border border-glass-border text-accent rounded-full font-mono">
              SIH Project ID: SIH26057
            </span>
          </div>
        </div>

        {/* Quick Summary Warning Card */}
        <Card className="bg-glass-strong border-glass-border-strong text-text-primary shadow-2xl overflow-hidden relative backdrop-blur-3xl">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-warning animate-pulse" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2 text-accent">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
              Strict Non-Copyable & View-Only Software Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-text-secondary text-sm leading-relaxed">
            <p>
              This software, including all underlying source code in repository{' '}
              <a 
                href="https://github.com/BPPIMTSIH26/SIH26057" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-accent underline font-mono hover:text-cyan inline-flex items-center gap-1"
              >
                https://github.com/BPPIMTSIH26/SIH26057 <ExternalLink className="w-3 h-3" />
              </a>, AI machine learning models, bathymetric data processing algorithms, sonar visualizers, UI designs, and documentation, is the exclusive proprietary property of <strong>Team (ORION)⁶⁹ (NetraSonar - S.A.G.A.R.)</strong>.
            </p>
            <p className="font-semibold text-warning bg-warning/10 p-3 rounded-xl border border-warning/30 text-xs md:text-sm">
              ANY UNAUTHORIZED COPYING, CLONING, REPRODUCING, SCRAPING, DISTRIBUTING, OR CREATING DERIVATIVE WORKS FROM THIS CODEBASE OR APPLICATION IS STRICTLY PROHIBITED AND CONSTITUTES AN INTELLECTUAL PROPERTY INFRINGEMENT.
            </p>
          </CardContent>
        </Card>

        {/* Detailed License Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Section 1: Copyright Ownership */}
          <Card className="bg-glass border-glass-border text-text-primary hover:border-glass-border-strong transition-all duration-300 backdrop-blur-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-accent font-display">
                <Copyright className="w-5 h-5" />
                1. Copyright & Ownership
              </CardTitle>
            </CardHeader>
            <CardContent className="text-text-secondary text-sm space-y-2">
              <p>
                <strong className="text-text-primary">Copyright © 2026 Team (ORION)⁶⁹ / S.A.G.A.R. Project.</strong> All Rights Reserved.
              </p>
              <p>
                All elements of S.A.G.A.R. (Sub-surface Anomaly Grid & Analysis Repository) — including React frontend scripts, Python FastAPI backends, ML anomaly detection pipelines, synthetic sonar dataset generators, and visual themes — are protected by national and international copyright laws.
              </p>
            </CardContent>
          </Card>

          {/* Section 2: Prohibitions */}
          <Card className="bg-glass border-glass-border text-text-primary hover:border-glass-border-strong transition-all duration-300 backdrop-blur-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-danger font-display">
                <Lock className="w-5 h-5" />
                2. Prohibition on Copying
              </CardTitle>
            </CardHeader>
            <CardContent className="text-text-secondary text-sm space-y-2">
              <p className="text-text-primary font-medium">
                You are explicitly forbidden from:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-text-secondary">
                <li>Cloning or downloading repository source code to any storage device.</li>
                <li>Copying code snippets, React components, CSS files, or algorithms.</li>
                <li>Extracting or re-using trained ML weights or synthetic sonar datasets.</li>
                <li>Redistributing, selling, or sublicensing any component of this software.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 3: View-Only Scope */}
          <Card className="bg-glass border-glass-border text-text-primary hover:border-glass-border-strong transition-all duration-300 backdrop-blur-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-accent font-display">
                <Globe className="w-5 h-5" />
                3. Permitted Scope: View-Only
              </CardTitle>
            </CardHeader>
            <CardContent className="text-text-secondary text-sm space-y-2">
              <p>
                Access to view this project online (or on GitHub) is provided solely for <strong className="text-text-primary">official evaluation and review for Smart India Hackathon (SIH26057)</strong>.
              </p>
              <p>
                Online visibility does NOT constitute an open source license, public domain dedication, or grant of any usage rights.
              </p>
            </CardContent>
          </Card>

          {/* Section 4: Technical Anti-Copying */}
          <Card className="bg-glass border-glass-border text-text-primary hover:border-glass-border-strong transition-all duration-300 backdrop-blur-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-warning font-display">
                <Code2 className="w-5 h-5" />
                4. Anti-Copying Protections
              </CardTitle>
            </CardHeader>
            <CardContent className="text-text-secondary text-sm space-y-2">
              <p>
                This application incorporates active client-side and repository-level anti-copy protection mechanisms:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-text-secondary">
                <li>Right-click context menu prevention.</li>
                <li>Copy, cut, print, and view-source shortcut restrictions.</li>
                <li>Image and bathymetric canvas drag protection.</li>
                <li>Repository license tracking and DMCA automation.</li>
              </ul>
            </CardContent>
          </Card>

        </div>

        {/* Legal Enforcement Section */}
        <Card className="bg-glass-strong border-glass-border-strong text-text-primary p-4 rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-danger font-display">
              <Scale className="w-6 h-6" />
              5. Legal Enforcement & Copyright Violation Reporting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-text-secondary">
            <p>
              Any detected unauthorized copy, clone, or mirror of this repository will be subject to immediate legal action, including DMCA takedown filings, GitHub organization reporting, and institutional notify procedures.
            </p>
            <div className="p-4 bg-surface rounded-xl border border-glass-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-text-primary text-xs uppercase tracking-wider font-mono">Repository URL:</p>
                <p className="text-accent font-mono text-xs">https://github.com/BPPIMTSIH26/SIH26057</p>
              </div>
              <a
                href="https://github.com/BPPIMTSIH26/SIH26057/blob/main/LICENSE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-accent hover:bg-cyan text-void font-bold rounded-lg text-xs transition-colors flex items-center gap-2 shrink-0 shadow-lg"
              >
                <FileText className="w-4 h-4" /> View Full License File
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-xs text-text-muted pt-4 border-t border-glass-border font-mono">
          © 2026 Team (ORION)⁶⁹ (S.A.G.A.R. - SIH26057). All Rights Reserved. Proprietary Non-Copyable System.
        </div>

      </div>
    </div>
  );
}
