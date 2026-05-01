'use client';
// apps/platform/components/properties/PropertyMarketing.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Share2,
  Link,
  Copy,
  CheckCheck,
  Eye,
  Heart,
  TrendingUp,
  MessageCircle,
  Twitter,
  Facebook,
  Mail,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@newcondo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Input } from '@newcondo/ui/components/input';
import { Label } from '@newcondo/ui/components/label';
import { propertyApi, shareProperty } from '@/lib/api/properties';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyMarketingProps {
  propertyId: string;
}

// ─── Share channel config ─────────────────────────────────────────────────────

function buildShareUrl(channel: string, link: string, title: string): string {
  const encoded = encodeURIComponent(link);
  const text = encodeURIComponent(`Check out this property: ${title}`);
  switch (channel) {
    case 'whatsapp':
      return `https://wa.me/?text=${text}%20${encoded}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${text}&url=${encoded}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
    case 'email':
      return `mailto:?subject=${encodeURIComponent(title)}&body=${text}%20${encoded}`;
    default:
      return link;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PropertyMarketing({ propertyId }: PropertyMarketingProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertyApi.getById(propertyId),
    staleTime: 5 * 60 * 1000,
  });

  const { mutateAsync: generateLink, isPending: isGenerating } = useMutation({
    mutationFn: () => shareProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
    },
  });

  const shareableLink = property?.shareableLink
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/properties/${property.shareableLink}`
    : null;

  const handleCopy = async () => {
    if (!shareableLink) return;
    await navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = (channel: string) => {
    if (!shareableLink || !property) return;
    const url = buildShareUrl(channel, shareableLink, property.title);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !property) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-red-500">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
          Failed to load property. Please try again.
        </CardContent>
      </Card>
    );
  }

  const stats = [
    { label: 'Total Views', value: property.viewCount ?? 0, icon: Eye, color: 'text-blue-600 bg-blue-50' },
    { label: 'Favourites', value: property.favoriteCount ?? 0, icon: Heart, color: 'text-pink-600 bg-pink-50' },
  ];

  const shareChannels = [
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500 hover:bg-green-600' },
    { id: 'twitter', label: 'Twitter / X', icon: Twitter, color: 'bg-sky-500 hover:bg-sky-600' },
    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'email', label: 'Email', icon: Mail, color: 'bg-gray-600 hover:bg-gray-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marketing</h2>
          <p className="mt-1 text-sm text-gray-500 line-clamp-1">{property.title}</p>
        </div>
        <Badge
          className={
            property.status === 'PUBLISHED'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-700'
          }
        >
          {property.status}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-full p-2 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Shareable link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link className="h-4 w-4" />
            Shareable Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {shareableLink ? (
            <>
              <div className="space-y-2">
                <Label>Your listing link</Label>
                <div className="flex gap-2">
                  <Input value={shareableLink} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 gap-1.5">
                    {copied ? (
                      <>
                        <CheckCheck className="h-4 w-4 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(shareableLink, '_blank')}
                    className="shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Social share buttons */}
              <div className="space-y-2">
                <Label>Share on</Label>
                <div className="flex flex-wrap gap-2">
                  {shareChannels.map(({ id, label, icon: Icon, color }) => (
                    <Button
                      key={id}
                      size="sm"
                      onClick={() => handleShare(id)}
                      className={`gap-1.5 text-white ${color}`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Generate a shareable link to promote this property on social media, WhatsApp, or
                anywhere else.
              </p>
              <Button
                onClick={() => generateLink()}
                disabled={isGenerating}
                className="gap-1.5"
              >
                <Share2 className="h-4 w-4" />
                {isGenerating ? 'Generating…' : 'Generate Shareable Link'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Marketing Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              'Add high-quality photos to increase views by up to 3×.',
              'Share your listing on WhatsApp groups in your target area.',
              'Make sure your boundary is verified — it builds trust with renters.',
              'Keep your price competitive by checking similar listings in your city.',
              'Respond to enquiries quickly to improve your listing rank.',
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}