// apps/platform/components/referrals/ReferralOnboarding.tsx

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@newcondo/ui/components/dialog';
import { Button } from '@newcondo/ui/components/button';
import { Card, CardContent } from '@newcondo/ui/components/card';
import { Progress } from '@newcondo/ui/components/progress';
import { Share2, Users, Gift, Trophy, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/referralHelpers';

interface ReferralOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferralOnboarding({ isOpen, onClose }: ReferralOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Referrals!',
      description: 'Earn rewards by inviting friends to NewCondo',
      icon: <Gift className="h-12 w-12 text-blue-600" />,
      content: (
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Our referral program rewards you for helping NewCondo grow. You and your friends both benefit!
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-blue-600">₦10,000</p>
                <p className="text-sm text-muted-foreground mt-1">Max reward per referral</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-600">₦50,000</p>
                <p className="text-sm text-muted-foreground mt-1">Milestone bonuses</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      title: 'How It Works',
      description: 'Simple steps to start earning',
      icon: <Users className="h-12 w-12 text-green-600" />,
      content: (
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
              1
            </div>
            <div>
              <h4 className="font-medium mb-1">Share Your Link</h4>
              <p className="text-sm text-muted-foreground">
                Get your unique referral link and share it with friends via WhatsApp, email, or social media
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
              2
            </div>
            <div>
              <h4 className="font-medium mb-1">Friends Sign Up</h4>
              <p className="text-sm text-muted-foreground">
                When they join using your link and complete their profile, they're tracked as your referral
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
              3
            </div>
            <div>
              <h4 className="font-medium mb-1">Earn Rewards</h4>
              <p className="text-sm text-muted-foreground">
                Once they subscribe or complete a transaction, both of you receive rewards!
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Reward Structure',
      description: 'Different rewards for different referral types',
      icon: <Trophy className="h-12 w-12 text-purple-600" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Rewards vary based on who you refer:
          </p>

          {[
            { type: 'Owner → Owner', you: '₦10,000', them: '₦5,000', icon: '🏠' },
            { type: 'Agent → Renter', you: '₦5,000', them: '₦5,000', icon: '🤝' },
            { type: 'Owner → Agent', you: '₦5,000', them: '₦5,000', icon: '👔' },
            { type: 'Renter → Renter', you: '₦1,000', them: '₦1,000', icon: '👥' },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-sm">{item.type}</span>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-green-600">You: {item.you}</p>
                <p className="text-muted-foreground">Them: {item.them}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Milestone Bonuses',
      description: 'Extra rewards as you reach referral goals',
      icon: <CheckCircle className="h-12 w-12 text-orange-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Unlock bonus rewards as you reach these milestones:
          </p>

          {[
            { count: 5, bonus: 5000, icon: '🥉' },
            { count: 10, bonus: 10000, icon: '🥈' },
            { count: 25, bonus: 25000, icon: '🥇' },
            { count: 50, bonus: 50000, icon: '👑' },
          ].map((milestone, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg border-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{milestone.icon}</span>
                <div>
                  <p className="font-semibold">{milestone.count} Referrals</p>
                  <p className="text-xs text-muted-foreground">Milestone bonus unlocked</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(milestone.bonus)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Ready to Start?',
      description: 'Begin inviting friends and earning rewards',
      icon: <Share2 className="h-12 w-12 text-blue-600" />,
      content: (
        <div className="space-y-6 text-center">
          <p className="text-muted-foreground">
            You're all set! Start sharing your referral link and watch your rewards grow.
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Quick Tips:</h4>
            <ul className="text-sm text-left space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Personal messages work better than generic ones</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Share on multiple channels for better reach</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Track your progress on the analytics page</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Rewards are credited within 24 hours</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            {currentStepData.icon}
          </div>
          <DialogTitle className="text-center text-2xl">
            {currentStepData.title}
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            {currentStepData.description}
          </p>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <div className="py-6">
          {currentStepData.content}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {currentStep === 0 ? (
            <Button variant="ghost" onClick={handleSkip}>
              Skip Tutorial
            </Button>
          ) : (
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}

          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? (
              'Get Started'
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-blue-600 w-8'
                  : index < currentStep
                  ? 'bg-blue-400'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}