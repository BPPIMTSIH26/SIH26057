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
    <div className="h-full w-full overflow-y-auto bg-void text-text-primary p-6 md:p-10 font-sans select-none scrollbar-thin">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        
        {/* Page Hero Header */}
        <div className="text-center space-y-3 relative pt-4">
          <div className="inline-flex items-center justify-center p-3 bg-glass border border-glass-border rounded-xl mb-1 backdrop-blur-3xl shadow-sm">
            <ShieldCheck className="w-8 h-8 text-text-secondary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-text-primary">
            Copyright & Proprietary License Notice
          </h1>
          <p className="text-text-muted text-sm md:text-base max-w-2xl mx-auto font-normal">
            Official Intellectual Property Rights & Non-Copyable Usage Terms for S.A.G.A.R. (Sub-surface Anomaly Grid & Analysis Repository)
          </p>
          <div className="flex items-center justify-center gap-2 pt-1 text-xs font-mono">
            <span className="px-3 py-1 bg-glass border border-glass-border text-text-secondary rounded-full font-medium flex items-center gap-1.5 text-[11px]">
              <Lock className="w-3 h-3 text-text-muted" /> PROPRIETARY & ALL RIGHTS RESERVED
            </span>
            <span className="px-3 py-1 bg-glass border border-glass-border text-text-muted rounded-full text-[11px]">
              SIH Project ID: SIH26057
            </span>
          </div>
        </div>

        {/* Quick Summary Warning Card */}
        <Card className="bg-glass border-glass-border text-text-primary shadow-md overflow-hidden relative backdrop-blur-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-text-primary font-display font-medium">
              <AlertTriangle className="w-4 h-4 text-text-secondary shrink-0" />
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
                className="text-text-primary underline font-mono hover:text-accent inline-flex items-center gap-1"
              >
                https://github.com/BPPIMTSIH26/SIH26057 <ExternalLink className="w-3 h-3 text-text-muted" />
              </a>, AI machine learning models, bathymetric data processing algorithms, sonar visualizers, UI designs, and documentation, is the exclusive proprietary property of <strong>Team (ORION)⁶⁹ (NetraSonar - S.A.G.A.R.)</strong>.
            </p>
            <p className="font-medium text-text-secondary bg-glass-strong p-3 rounded-lg border border-glass-border text-xs md:text-sm">
              ANY UNAUTHORIZED COPYING, CLONING, REPRODUCING, SCRAPING, DISTRIBUTING, OR CREATING DERIVATIVE WORKS FROM THIS CODEBASE OR APPLICATION IS STRICTLY PROHIBITED AND CONSTITUTES AN INTELLECTUAL PROPERTY INFRINGEMENT.
            </p>
          </CardContent>
        </Card>

        {/* Detailed License Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Section 1: Copyright Ownership */}
          <Card className="bg-glass border-glass-border text-text-primary hover:border-glass-border-strong transition-all duration-200 backdrop-blur-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-text-primary font-display font-medium">
                <Copyright className="w-4 h-4 text-text-muted" />
                1. Copyright & Ownership
              </CardTitle>
            </CardHeader>
            <CardContent className="text-text-secondary text-xs md:text-sm space-y-2">
              <p>
                <strong className="text-text-primary font-medium">Copyright © 2026 Team (ORION)⁶⁹ / S.A.G.A.R. Project.</strong> All Rights Reserved.
              </p>
              <p className="text-text-muted">
                All elements of S.A.G.A.R. (Sub-surface Anomaly Grid & Analysis Repository) — including React frontend scripts, Python FastAPI backends, ML anomaly detection pipelines, synthetic sonar dataset generators, and visual themes — are protected by national and international copyright laws.
              </p>
            </CardContent>
          </Card>

          {/* Section 2: Prohibitions */}
          <Card className="bg-glass border-glass-border text-text-primary hover:border-glass-border-strong transition-all duration-200 backdrop-blur-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-text-primary font-display font-medium">
                <Lock className="w-4 h-4 text-text-muted" />
                2. Prohibition on Copying
              </CardTitle>
            </CardHeader>
            <CardContent className="text-text-secondary text-xs md:text-sm space-y-2">
              <p className="text-text-primary font-medium text-xs">
                You are explicitly forbidden from:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-text-muted text-xs">
                <li>Cloning or downloading repository source code to any storage device.</li>
                <li>Copying code snippets, React components, CSS files, or algorithms.</li>
                <li>Extracting or re-using trained ML weights or synthetic sonar datasets.</li>
                <li>Redistributing, selling, or sublicensing any component of this software.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 3: View-Only Scope */}
          <Card className="bg-glass border-glass-border text-text-primary hover:border-glass-border-strong transition-all duration-200 backdrop-blur-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-text-primary font-display font-medium">
                <Globe className="w-4 h-4 text-text-muted" />
                3. Permitted Scope: View-Only
              </CardTitle>
            </CardHeader>
            <CardContent className="text-text-secondary text-xs md:text-sm space-y-2">
              <p className="text-text-muted">
                Access to view this project online (or on GitHub) is provided solely for <strong className="text-text-primary font-medium">official evaluation and review for Smart India Hackathon (SIH26057)</strong>.
              </p>
              <p className="text-text-muted">
                Online visibility does NOT constitute an open source license, public domain dedication, or grant of any usage rights.
              </p>
            </CardContent>
          </Card>

          {/* Section 4: Technical Anti-Copying */}
          <Card className="bg-glass border-glass-border text-text-primary hover:border-glass-border-strong transition-all duration-200 backdrop-blur-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-text-primary font-display font-medium">
                <Code2 className="w-4 h-4 text-text-muted" />
                4. Anti-Copying Protections
              </CardTitle>
            </CardHeader>
            <CardContent className="text-text-secondary text-xs md:text-sm space-y-2">
              <p className="text-text-muted text-xs">
                This application incorporates active client-side and repository-level anti-copy protection mechanisms:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-text-muted text-xs">
                <li>Right-click context menu prevention.</li>
                <li>Copy, cut, print, and view-source shortcut restrictions.</li>
                <li>Image and bathymetric canvas drag protection.</li>
                <li>Repository license tracking and DMCA automation.</li>
              </ul>
            </CardContent>
          </Card>

        </div>

        {/* Legal Enforcement Section */}
        <Card className="bg-glass border-glass-border text-text-primary p-4 rounded-xl shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-text-primary font-display font-medium">
              <Scale className="w-5 h-5 text-text-muted" />
              5. Legal Enforcement & Copyright Violation Reporting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs md:text-sm text-text-secondary">
            <p className="text-text-muted">
              Any detected unauthorized copy, clone, or mirror of this repository will be subject to immediate legal action, including DMCA takedown filings, GitHub organization reporting, and institutional notify procedures.
            </p>
            <div className="p-3 bg-surface rounded-lg border border-glass-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="font-medium text-text-primary text-[10px] uppercase tracking-wider font-mono">Repository URL:</p>
                <p className="text-text-secondary font-mono text-xs">https://github.com/BPPIMTSIH26/SIH26057</p>
              </div>
              <a
                href="https://github.com/BPPIMTSIH26/SIH26057/blob/main/LICENSE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-glass hover:bg-glass-strong text-text-primary border border-glass-border font-medium rounded-md text-xs transition-colors flex items-center gap-1.5 shrink-0 font-mono"
              >
                <FileText className="w-3.5 h-3.5 text-text-muted" /> View Full License File
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-[11px] text-text-muted pt-4 border-t border-glass-border/40 font-mono">
          © 2026 Team (ORION)⁶⁹ (S.A.G.A.R. - SIH26057). All Rights Reserved. Proprietary Non-Copyable System.
        </div>

      </div>
    </div>
  );
}
