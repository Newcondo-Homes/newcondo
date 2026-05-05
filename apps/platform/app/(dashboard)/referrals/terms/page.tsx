// apps/platform/app/(dashboard)/referrals/terms/page.tsx
import { Card } from "@newcondo/ui/components/card";
import { Button } from "@newcondo/ui/components/button";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Referral Program Terms & Conditions | NewCondo",
  description:
    "Terms and conditions for the NewCondo referral program. Learn about eligibility, rewards, and program rules.",
};

export default function ReferralTermsPage() {
  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/referrals">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">
              Referral Program Terms & Conditions
            </h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <Card className="p-8 space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Program Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            {/* fix lines 39: escaped double quotes around "Program" */}
            The NewCondo Referral Program (&quot;Program&quot;) allows existing users to
            refer new users to the platform and earn rewards when those
            referrals complete qualifying actions. By participating in this
            Program, you agree to these terms and conditions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Eligibility</h2>
          <div className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              To participate in the Program, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                Have an active NewCondo account in good standing
              </li>
              <li>
                Have completed account verification (for property owners and
                agents)
              </li>
              <li>
                Have completed at least one paid transaction on the platform
              </li>
              <li>
                Not be in violation of any NewCondo policies or terms of service
              </li>
              <li>
                Be a resident of Nigeria (for payout eligibility)
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Referral Qualification</h2>
          <div className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              {/* fix line 77: escaped double quotes around "qualified" */}
              A referral is considered &quot;qualified&quot; when the referred user:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Signs up using your unique referral code or link</li>
              <li>Completes account verification</li>
              <li>
                Completes their first qualifying transaction within 90 days of
                signup
              </li>
              <li>
                Is not an existing NewCondo user (no duplicate accounts)
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Qualifying transactions include: subscription payments, rent
              payments, or property marking service fees totaling at least
              ₦5,000.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Reward Structure</h2>
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Owner-to-Owner Referrals</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                Referrer: ₦10,000 service credit or 1 month free subscription
              </li>
              <li>
                Referred: ₦5,000 service credit or 50% off first month
              </li>
            </ul>

            <h3 className="text-lg font-medium mt-4">Owner-to-Agent Referrals</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Referrer: ₦5,000 commission credit</li>
              <li>Referred Agent: ₦5,000 subscription credit</li>
            </ul>

            <h3 className="text-lg font-medium mt-4">
              Owner-to-Renter Referrals
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Referrer: ₦2,000 upkeep credit</li>
              <li>Referred Renter: ₦2,000 rent credit</li>
            </ul>

            <h3 className="text-lg font-medium mt-4">
              Agent-to-Agent Referrals
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Both parties: ₦3,000 fee credit each</li>
            </ul>

            <h3 className="text-lg font-medium mt-4">
              Renter-to-Renter Referrals
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Both parties: ₦1,000-₦2,000 rent/service credit</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Reward Distribution</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>
              Rewards are credited within 7 business days of referral
              qualification
            </li>
            <li>
              Service credits can be used for subscriptions, rent payments, or
              platform services
            </li>
            <li>
              Cash rewards (where applicable) are credited to your virtual
              account
            </li>
            <li>
              Rewards are non-transferable and cannot be exchanged for cash
              unless specified
            </li>
            <li>
              Service credits expire 12 months from the date of issuance if
              unused
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            6. Program Limitations
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>
              There is no limit to the number of referrals you can make
            </li>
            <li>
              Maximum of 6 months free subscription from referral rewards per
              user per year
            </li>
            <li>Self-referrals are strictly prohibited</li>
            <li>Referrals must be genuine users, not created for gaming the system</li>
            <li>
              NewCondo reserves the right to cap total referral earnings per
              user at its discretion
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">7. Prohibited Activities</h2>
          <p className="text-muted-foreground leading-relaxed">
            The following activities are strictly prohibited and may result in
            disqualification and account termination:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Creating fake accounts to claim referral rewards</li>
            <li>
              Using automated bots or scripts to generate referral sign-ups
            </li>
            <li>Spamming or unsolicited mass distribution of referral links</li>
            <li>Misrepresenting the Program or NewCondo services</li>
            <li>
              Any fraudulent activity related to referrals or reward claims
            </li>
            <li>
              Purchasing or selling referral codes or accounts
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">8. Tracking & Attribution</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>
              Referrals are tracked via unique codes embedded in referral links
            </li>
            <li>
              Cookies and session data are used to maintain referral attribution
            </li>
            <li>
              The first referral code used during signup is credited (no
              overwriting)
            </li>
            <li>
              Referral attribution expires 90 days after initial click/signup
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">9. Program Changes</h2>
          <p className="text-muted-foreground leading-relaxed">
            NewCondo reserves the right to modify, suspend, or terminate the
            Referral Program at any time, with or without notice. Changes to
            reward amounts, qualification criteria, or other terms will be
            communicated via email and platform notifications. Continued
            participation in the Program after changes constitutes acceptance of
            the new terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">10. Fraud Prevention</h2>
          <p className="text-muted-foreground leading-relaxed">
            NewCondo employs automated and manual fraud detection systems.
            Suspicious activity may result in temporary reward holds, account
            review, or permanent disqualification. Users found violating these
            terms may forfeit all earned rewards and face account suspension or
            termination.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">11. Tax Responsibilities</h2>
          <p className="text-muted-foreground leading-relaxed">
            Users are responsible for any tax obligations arising from referral
            rewards. NewCondo may be required to report reward earnings to tax
            authorities as required by Nigerian law. Consult with a tax
            professional for guidance on your specific situation.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">12. Contact & Disputes</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions about the Referral Program or to dispute a referral
            attribution, contact our support team at support@newcondo.ng.
            Disputes must be submitted within 30 days of the qualifying event.
            NewCondo&apos;s decision on disputes is final.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">13. Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            These terms are governed by the laws of the Federal Republic of
            Nigeria. Any disputes arising from the Referral Program shall be
            subject to the exclusive jurisdiction of Nigerian courts.
          </p>
        </section>

        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            By participating in the NewCondo Referral Program, you acknowledge
            that you have read, understood, and agree to these terms and
            conditions.
          </p>
        </div>
      </Card>

      <div className="flex gap-3 justify-center">
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard/referrals">Back to Referrals</Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/dashboard/referrals">Start Referring</Link>
        </Button>
      </div>
    </div>
  );
}