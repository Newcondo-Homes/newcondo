// apps/platform/components/marketing/ShareableLinkGenerator.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Link as LinkIcon, Check, RefreshCw } from 'lucide-react';

interface ShareableLinkGeneratorProps {
  propertyId: string;
  currentLink?: string;
  onGenerate: () => Promise<string>;
  onRegenerate: () => Promise<string>;
}

export function ShareableLinkGenerator({
  propertyId,
  currentLink,
  onGenerate,
  onRegenerate,
}: ShareableLinkGeneratorProps) {
  const [link, setLink] = useState(currentLink || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const newLink = await onGenerate();
      setLink(newLink);
      toast({
        title: 'Link generated',
        description: 'Shareable link has been created successfully',
      });
    } catch (error) {
      console.error('Generate error:', error);
      toast({
        title: 'Generation failed',
        description: 'Failed to generate shareable link',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setIsGenerating(true);
      const newLink = await onRegenerate();
      setLink(newLink);
      toast({
        title: 'Link regenerated',
        description: 'A new shareable link has been created',
      });
    } catch (error) {
      console.error('Regenerate error:', error);
      toast({
        title: 'Regeneration failed',
        description: 'Failed to regenerate shareable link',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setIsCopied(true);
      toast({
        title: 'Link copied',
        description: 'Shareable link copied to clipboard',
      });

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: 'Copy failed',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Shareable Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {link ? (
          <>
            <div className="space-y-2">
              <Label>Your shareable link</Label>
              <div className="flex gap-2">
                <Input value={link} readOnly className="font-mono text-sm" />
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="icon"
                  disabled={isCopied}
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link to track views and referrals for this property
              </p>
            </div>

            <Button
              onClick={handleRegenerate}
              variant="outline"
              disabled={isGenerating}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isGenerating ? 'Regenerating...' : 'Regenerate Link'}
            </Button>
          </>
        ) : (
          <div className="text-center py-6">
            <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Generate a unique shareable link for this property to track views
              and conversions
            </p>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Link'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}