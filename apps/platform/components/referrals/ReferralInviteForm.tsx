// apps/platform/components/referrals/ReferralInviteForm.tsx

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui/components/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { InviteViaEmail } from './InviteViaEmail';
import { InviteViaSMS } from './InviteViaSMS';
import { InviteViaWhatsApp } from './InviteViaWhatsApp';
import { Mail, MessageSquare, Phone } from 'lucide-react';

export function ReferralInviteForm() {
  const [activeTab, setActiveTab] = useState('email');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Friends</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <Phone className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-6">
            <InviteViaEmail />
          </TabsContent>

          <TabsContent value="sms" className="mt-6">
            <InviteViaSMS />
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-6">
            <InviteViaWhatsApp />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}