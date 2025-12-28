// apps/platform/lib/constants/shareMessages.ts

import { REFERRAL_CONFIG } from './referralConfig';

export interface ShareMessage {
  template: string;
  subject?: string;
  maxLength?: number;
}

export const SHARE_MESSAGES = {
  whatsapp: {
    default: `Hey! 👋 I'm using NewCondo for property management and it's amazing! Join using my link and we both get rewards: {link}`,
    owner: `🏠 Managing your properties? Try NewCondo! Use my link to get ₦{referredAmount} in service credits: {link}`,
    agent: `🤝 Real estate agents, check out NewCondo! Get ₦{referredAmount} commission credit when you join: {link}`,
    renter: `🏘️ Looking for a place? Find your next home on NewCondo and get ₦{referredAmount} rent credit: {link}`,
    maxLength: 500
  },
  email: {
    default: {
      subject: 'Join me on NewCondo - Get special rewards!',
      template: `Hi!

I've been using NewCondo for property management and thought you'd love it too.

NewCondo makes it easy to manage properties, find tenants, and handle rent payments all in one place.

Join using my referral link and we'll both get rewards:
{link}

You'll receive ₦{referredAmount} in {rewardType} after completing your first transaction!

Cheers,
{referrerName}`
    },
    owner: {
      subject: 'Simplify your property management with NewCondo',
      template: `Hi!

As a fellow property owner, I wanted to share NewCondo with you.

NewCondo has made managing my properties so much easier:
✓ Automated rent collection
✓ Professional property listings
✓ Maintenance tracking
✓ Virtual account management

Join using my link and get ₦{referredAmount} in free services:
{link}

Best regards,
{referrerName}`
    },
    agent: {
      subject: 'Grow your real estate business with NewCondo',
      template: `Hi!

I've been growing my real estate business with NewCondo and wanted to invite you.

Benefits for agents:
✓ Commission tracking
✓ Property promotion tools
✓ Client management
✓ Referral earnings

Join my network and get ₦{referredAmount} commission credit:
{link}

Looking forward to collaborating!
{referrerName}`
    },
    renter: {
      subject: 'Find your perfect home on NewCondo',
      template: `Hi!

Looking for a place to rent? Check out NewCondo!

I found my current home here and the experience was great:
✓ Verified properties
✓ Easy payment process
✓ Direct landlord communication
✓ Transparent pricing

Use my link to get ₦{referredAmount} rent credit:
{link}

Happy house hunting!
{referrerName}`
    }
  },
  sms: {
    default: `Join NewCondo using my code {code} and get ₦{referredAmount} credit! {link}`,
    owner: `Manage properties easier with NewCondo! Use code {code} for ₦{referredAmount} free service: {link}`,
    agent: `Grow your real estate business! Join NewCondo with code {code}, get ₦{referredAmount} credit: {link}`,
    renter: `Find your next home on NewCondo! Use code {code} for ₦{referredAmount} off: {link}`,
    maxLength: 160
  },
  facebook: {
    default: `🏠 I've been using NewCondo for property management and it's been a game-changer!

Join me and get special rewards when you sign up: {link}

#NewCondo #PropertyManagement #RealEstate`,
    maxLength: 400
  },
  twitter: {
    default: `Managing properties made easy with @NewCondoNG! 🏠

Join using my link and get rewards: {link}

#PropTech #PropertyManagement #Nigeria`,
    maxLength: 280
  },
  linkedin: {
    default: `I've been impressed with NewCondo's property management platform. It streamlines everything from tenant management to rent collection.

If you're a property owner, agent, or looking to rent, I'd recommend checking it out: {link}

New users get special signup rewards!

#PropertyManagement #RealEstate #PropTech #Nigeria`,
    maxLength: 600
  },
  copy: {
    default: `Join NewCondo and enjoy seamless property management!

Use my referral link: {link}
Referral code: {code}

Get ₦{referredAmount} in {rewardType} when you complete your first transaction!`
  }
} as const;

export const SHARE_CHANNEL_CONFIG = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '📱',
    color: '#25D366',
    shareUrl: (url: string, message: string) => 
      `https://wa.me/?text=${encodeURIComponent(message)}`,
    isAvailable: true
  },
  {
    id: 'email',
    name: 'Email',
    icon: '📧',
    color: '#EA4335',
    shareUrl: (url: string, message: string, subject?: string) => 
      `mailto:?subject=${encodeURIComponent(subject || 'Join NewCondo')}&body=${encodeURIComponent(message)}`,
    isAvailable: true
  },
  {
    id: 'sms',
    name: 'SMS',
    icon: '💬',
    color: '#0084FF',
    shareUrl: (url: string, message: string) => 
      `sms:?body=${encodeURIComponent(message)}`,
    isAvailable: true
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '👍',
    color: '#1877F2',
    shareUrl: (url: string) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    isAvailable: true
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: '🐦',
    color: '#1DA1F2',
    shareUrl: (url: string, message: string) => 
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`,
    isAvailable: true
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0077B5',
    shareUrl: (url: string) => 
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    isAvailable: true
  },
  {
    id: 'copy',
    name: 'Copy Link',
    icon: '🔗',
    color: '#6B7280',
    shareUrl: (url: string) => url,
    isAvailable: true
  }
];

// Helper to replace placeholders in messages
export function formatShareMessage(
  template: string,
  data: {
    link: string;
    code: string;
    referrerName?: string;
    referredAmount?: number;
    referrerAmount?: number;
    rewardType?: string;
  }
): string {
  return template
    .replace(/{link}/g, data.link)
    .replace(/{code}/g, data.code)
    .replace(/{referrerName}/g, data.referrerName || 'NewCondo User')
    .replace(/{referredAmount}/g, String(data.referredAmount || 0))
    .replace(/{referrerAmount}/g, String(data.referrerAmount || 0))
    .replace(/{rewardType}/g, data.rewardType || 'service credit');
}