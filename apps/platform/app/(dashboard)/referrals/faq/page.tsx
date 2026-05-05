// apps/platform/app/(dashboard)/referrals/faq/page.tsx
import { Card } from "@newcondo/ui/components/card";
import { Button } from "@newcondo/ui/components/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@newcondo/ui/components/accordion";
import { ArrowLeft, HelpCircle, MessageCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Referral Program FAQ | NewCondo",
  description:
    "Frequently asked questions about the NewCondo referral program. Get answers to common questions about rewards, eligibility, and more.",
};

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I participate in the referral program?",
        a: "To participate, you need an active NewCondo account that has completed at least one paid transaction. Once eligible, you'll automatically receive a unique referral code and link that you can share with friends.",
      },
      {
        q: "Where can I find my referral code and link?",
        a: "Your referral code and shareable link are available on your Referrals dashboard at /dashboard/referrals. You can copy the link with one click and share it via WhatsApp, email, or any other platform.",
      },
      {
        q: "Who can I refer?",
        a: "You can refer anyone who doesn't currently have a NewCondo account. This includes property owners, real estate agents, and renters. Each user type has different reward structures.",
      },
    ],
  },
  {
    category: "Rewards & Earnings",
    questions: [
      {
        q: "How much can I earn from referrals?",
        a: "Rewards vary by referral type: Owner-to-Owner referrals earn ₦10,000, Owner-to-Agent earns ₦5,000, Owner-to-Renter earns ₦2,000, Agent-to-Agent earns ₦3,000, and Renter-to-Renter earns ₦1,000-₦2,000. There's no limit to how many people you can refer!",
      },
      {
        q: "What types of rewards do I receive?",
        a: "Rewards are typically given as service credits that can be used for subscriptions, rent payments, or platform services. Some referral types may also include free subscription months or maintenance vouchers.",
      },
      {
        q: "When will I receive my referral reward?",
        a: "Rewards are credited within 7 business days after your referral qualifies by completing their first paid transaction. You'll receive a notification when the reward is added to your account.",
      },
      {
        q: "Do referral rewards expire?",
        a: "Yes, service credit rewards expire 12 months from the date they're issued if unused. You'll receive notifications before your rewards expire so you don't miss out.",
      },
      {
        q: "Can I withdraw my referral rewards as cash?",
        a: "Most rewards are service credits meant to be used on the platform. However, commission credits for agents can be withdrawn to your linked bank account after they're released.",
      },
    ],
  },
  {
    category: "Qualification & Tracking",
    questions: [
      {
        q: "When does a referral count as 'qualified'?",
        a: "A referral qualifies when the new user signs up using your link, completes account verification, and makes their first qualifying transaction (minimum ₦5,000) within 90 days of signup.",
      },
      {
        q: "What counts as a qualifying transaction?",
        a: "Qualifying transactions include subscription payments, rent payments, or property marking service fees totaling at least ₦5,000. The transaction must be successfully completed and confirmed.",
      },
      {
        q: "How can I track my referrals?",
        a: "Your Referrals dashboard shows real-time tracking of all your referrals, including who clicked your link, who signed up, who qualified, and your total earnings. You can filter and search through your referral history.",
      },
      {
        q: "What if my friend doesn't use my referral link during signup?",
        a: "The referral must be tracked through your unique link or code for you to receive credit. Make sure your friend uses your link when signing up. Referrals cannot be manually attributed after the fact.",
      },
      {
        q: "How long does someone have to complete a qualifying transaction?",
        a: "Referred users have 90 days from their signup date to complete a qualifying transaction. After 90 days, the referral attribution expires and won't count toward your rewards.",
      },
    ],
  },
  {
    category: "Sharing & Promotion",
    questions: [
      {
        q: "How should I share my referral link?",
        a: "You can share your link through WhatsApp, email, SMS, social media, or any other channel. We provide easy sharing buttons and pre-written messages to make it simple. Just make sure you're not spamming or using it inappropriately.",
      },
      {
        q: "Can I promote my referral link on social media?",
        a: "Yes! You're encouraged to share on social media platforms like Facebook, Twitter, Instagram, and LinkedIn. However, avoid spam tactics, misleading claims, or excessive posting that could be seen as harassment.",
      },
      {
        q: "Is there a limit to how many people I can refer?",
        a: "There's no limit to the number of people you can refer. However, there may be annual caps on total earnings from referrals (e.g., maximum 6 months free subscription per year) to ensure fair use.",
      },
      {
        q: "Can I share my referral link offline?",
        a: "Absolutely! You can share your referral code verbally or in print. Your referred friend just needs to enter the code during signup. The code is shorter and easier to remember than the full link.",
      },
    ],
  },
  {
    category: "Rules & Restrictions",
    questions: [
      {
        q: "Can I refer myself or create multiple accounts?",
        a: "No. Self-referrals and creating fake accounts to claim rewards are strictly prohibited and will result in account termination and forfeiture of all rewards.",
      },
      {
        q: "What happens if I violate the referral program rules?",
        a: "Violations including fraud, spam, or abuse may result in immediate disqualification, forfeiture of all earned rewards, and possible account suspension or termination.",
      },
      {
        q: "Can someone be referred by multiple people?",
        a: "No. The first referral code used during signup is the one that counts. Once someone signs up with a referral code, it cannot be changed or credited to another referrer.",
      },
      {
        q: "Are there any geographic restrictions?",
        a: "The program is currently available to Nigerian residents only. Both referrer and referred user must be in Nigeria to qualify for rewards.",
      },
    ],
  },
  {
    category: "Account & Technical",
    questions: [
      {
        q: "I referred someone but didn't receive my reward. What should I do?",
        a: "First, check that your referral completed all qualification steps (signup, verification, and first transaction). If they did and it's been more than 7 business days, contact our support team at support@newcondo.ng with the referral details.",
      },
      {
        q: "Can I change my referral code?",
        a: "Your referral code is unique and permanent. It cannot be changed. However, you can create custom shareable links with campaign tracking if you're promoting through different channels.",
      },
      {
        q: "What if my referral link isn't working?",
        a: "Try generating a new link from your dashboard. If the problem persists, clear your browser cache or try a different browser. Contact support if the issue continues.",
      },
      {
        q: "How do I check my reward balance?",
        a: "Your total earned rewards and available balance are displayed on your Referrals dashboard and in the Rewards tab. You can also see a detailed transaction history of all rewards earned and used.",
      },
    ],
  },
  {
    category: "Program Changes",
    questions: [
      {
        q: "Can the referral program terms change?",
        a: "Yes. NewCondo reserves the right to modify or terminate the program at any time. We'll notify you of significant changes via email and platform notifications. Continued participation means you accept the new terms.",
      },
      {
        q: "What happens to my rewards if the program ends?",
        a: "If the program is terminated, any earned rewards in your account will remain valid until their expiration date. However, you won't be able to earn new rewards after the termination date.",
      },
    ],
  },
];

export default function ReferralFAQPage() {
  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/referrals">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">
              Referral Program FAQ
            </h1>
            <p className="text-muted-foreground">
              Find answers to common questions about our referral program
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <MessageCircle className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div className="space-y-2">
            <h3 className="font-semibold">Can&apos;t find what you&apos;re looking for?</h3>
            <p className="text-sm text-muted-foreground">
              Our support team is here to help! Contact us at{" "}
              <a
                href="mailto:support@newcondo.ng"
                className="text-primary hover:underline font-medium"
              >
                support@newcondo.ng
              </a>{" "}
              or use the chat widget in the bottom right corner.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {faqs.map((category, categoryIndex) => (
          <Card key={categoryIndex} className="p-6">
            <h2 className="text-xl font-semibold mb-4 pb-3 border-b">
              {category.category}
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {category.questions.map((item, questionIndex) => (
                <AccordionItem
                  key={questionIndex}
                  value={`item-${categoryIndex}-${questionIndex}`}
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">{item.q}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground leading-relaxed pt-2">
                      {item.a}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Ready to start referring?</h3>
          <p className="text-muted-foreground">
            Get your unique referral link and start earning rewards today!
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/dashboard/referrals">Go to Referrals</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard/referrals/terms">View Terms</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}