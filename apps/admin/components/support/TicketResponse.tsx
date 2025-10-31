// apps/admin/src/components/support/TicketResponse.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, Send, AlertCircle } from 'lucide-react';

interface TicketResponseProps {
  ticketId: string;
  onSubmit: (response: string) => Promise<void>;
}

export default function TicketResponse({ ticketId, onSubmit }: TicketResponseProps) {
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick response templates
  const templates = [
    {
      label: 'Investigation Started',
      text: 'Thank you for contacting us. We have received your ticket and are currently investigating the issue. We will provide you with an update as soon as possible.',
    },
    {
      label: 'More Information Needed',
      text: 'Thank you for reaching out. To help us resolve your issue more efficiently, could you please provide us with the following additional information:\n\n1. \n2. \n3. \n\nWe appreciate your cooperation.',
    },
    {
      label: 'Issue Resolved',
      text: 'We are pleased to inform you that your issue has been resolved. If you experience any further problems or have additional questions, please do not hesitate to contact us.',
    },
    {
      label: 'Technical Issue',
      text: 'We have identified a technical issue that is affecting your account. Our development team is working on a fix. We will notify you once the issue has been resolved.',
    },
    {
      label: 'Billing Issue',
      text: 'Thank you for bringing this billing matter to our attention. We have reviewed your account and are processing the necessary corrections. You should see the changes reflected within 24-48 hours.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!response.trim()) {
      setError('Please enter a response');
      return;
    }

    if (response.trim().length < 10) {
      setError('Response must be at least 10 characters long');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(response.trim());
      setResponse('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const insertTemplate = (template: string) => {
    setResponse(template);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Respond to Ticket
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Response Templates */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Quick Response Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <Button
                  key={template.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertTemplate(template.text)}
                >
                  {template.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Response Text Area */}
          <div>
            <label htmlFor="response" className="text-sm font-medium text-gray-700 mb-2 block">
              Your Response *
            </label>
            <Textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your response to the user here..."
              rows={8}
              disabled={submitting}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {response.length} characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setResponse('')}
              disabled={submitting || !response}
            >
              Clear
            </Button>
            <Button type="submit" disabled={submitting || !response.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Sending...' : 'Send Response'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}