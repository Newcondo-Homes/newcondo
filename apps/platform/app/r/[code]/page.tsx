// apps/platform/app/r/[code]/page.tsx

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, Gift, TrendingUp, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: {
    code: string;
  };
}

// This would fetch referral data server-side
async function getReferralData(code: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/referrals/public/${code}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getReferralData(params.code);

  if (!data?.valid) {
    return {
      title: 'Invalid Referral | NewCondo',
    };
  }

  return {
    title: `Join NewCondo - Invited by ${data.referrer.name} | NewCondo`,
    description: `Join NewCondo and get ${data.reward?.description || 'rewards'}`,
  };
}

export default async function ReferralLandingPage({ params }: Props) {
  const data = await getReferralData(params.code);

  // Invalid code
  if (!data?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Invalid Referral Code</h2>
            <p className="text-muted-foreground mb-6">
              This referral link is no longer valid or has expired.
            </p>
            <Link href="/register">
              <Button>Sign Up Anyway</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { referrer, reward } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <Badge className="mb-2">Exclusive Invitation</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              You've Been Invited to NewCondo!
            </h1>
            <p className="text-xl text-muted-foreground">
              Join {referrer.name} and discover seamless property management
            </p>
          </div>

          {/* Referrer Card */}
          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {referrer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Invited by</p>
                  <p className="text-xl font-semibold">{referrer.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {referrer.role.toLowerCase()}
                  </p>
                </div>
              </div>

              {reward && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Gift className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">
                        Your Welcome Reward
                      </p>
                      <p className="text-2xl font-bold text-green-700 mt-1">
                        ₦{reward.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-green-800 mt-1">
                        {reward.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Benefits Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Verified Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All properties are verified to prevent scams and ensure quality
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Easy Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Streamlined rent collection, maintenance tracking, and more
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Trusted Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Join thousands of property owners, agents, and renters
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
            <CardContent className="pt-8 pb-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
              <p className="mb-6 opacity-90">
                Join NewCondo today and claim your welcome reward
              </p>
              <Link href={`/register?ref=${params.code}`}>
                <Button size="lg" variant="secondary" className="gap-2">
                  Create Your Account
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <p className="text-sm mt-4 opacity-75">
                Already have an account?{' '}
                <Link href={`/login?ref=${params.code}`} className="underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Sign Up</p>
                    <p className="text-sm text-muted-foreground">
                      Create your free NewCondo account using this referral link
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Complete Your Profile</p>
                    <p className="text-sm text-muted-foreground">
                      Add your details and verify your account
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Qualify for Rewards</p>
                    <p className="text-sm text-muted-foreground">
                      Subscribe or make your first transaction to unlock your reward
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}