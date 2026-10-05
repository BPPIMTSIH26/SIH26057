import React from 'react';
import { Mail, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { PageCloseButton } from '../components/ui/PageCloseButton';

export default function Contact() {
  return (
    <div className="h-full w-full overflow-y-auto bg-void text-text-primary p-6 md:p-10 font-sans select-none scrollbar-thin relative">
      <PageCloseButton />
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="text-center space-y-4">
          <Users className="w-16 h-16 text-accent mx-auto" />
          <h1 className="text-4xl font-bold tracking-tight">Contact Information</h1>
        </div>

        <Card className="bg-bg-card border-border-card text-text-main">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Mail className="w-5 h-5 text-accent" />
              Team (ORION)⁶⁹ (BPPIMTSIH26)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-text-secondary">
            <p><strong>Problem Statement:</strong> SIH26057</p>
            <p><strong>Organization:</strong> Ministry of Earth Sciences / National Institute of Ocean Technology</p>
            <p>This prototype was developed for the Smart India Hackathon. For inquiries regarding the dataset, model architecture, or data deletion requests, please reach out to the team via the official hackathon portals.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
