// apps/admin/src/components/referrals/ReferralSettingsForm.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { referralAdminAPI } from "@/lib/api/referralAdmin";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw } from "lucide-react";

interface ReferralSettings {
  // Owner-to-Owner
  ownerToOwnerEnabled: boolean;
  ownerToOwnerReferrerReward: number;
  ownerToOwnerReferredReward: number;
  ownerToOwnerRewardType: string;

  // Owner-to-Agent
  ownerToAgentEnabled: boolean;
  ownerToAgentReferrerReward: number;
  ownerToAgentReferredReward: number;
  ownerToAgentRewardType: string;

  // Owner-to-Renter
  ownerToRenterEnabled: boolean;
  ownerToRenterReferrerReward: number;
  ownerToRenterReferredReward: number;
  ownerToRenterRewardType: string;

  // Agent-to-Owner
  agentToOwnerEnabled: boolean;
  agentToOwnerReferrerReward: number;
  agentToOwnerReferredReward: number;
  agentToOwnerRewardType: string;

  // Agent-to-Agent
  agentToAgentEnabled: boolean;
  agentToAgentReferrerReward: number;
  agentToAgentReferredReward: number;
  agentToAgentRewardType: string;

  // Agent-to-Renter
  agentToRenterEnabled: boolean;
  agentToRenterReferrerReward: number;
  agentToRenterReferredReward: number;
  agentToRenterRewardType: string;

  // Renter-to-Renter
  renterToRenterEnabled: boolean;
  renterToRenterReferrerReward: number;
  renterToRenterReferredReward: number;
  renterToRenterRewardType: string;

  // General settings
  minQualificationAmount: number;
  rewardExpiryDays: number;
  maxReferralsPerUser: number;
  fraudDetectionEnabled: boolean;
  autoApproveRewards: boolean;
  termsAndConditions: string;
}

const defaultSettings: ReferralSettings = {
  ownerToOwnerEnabled: true,
  ownerToOwnerReferrerReward: 10000,
  ownerToOwnerReferredReward: 5000,
  ownerToOwnerRewardType: "SERVICE_CREDIT",

  ownerToAgentEnabled: true,
  ownerToAgentReferrerReward: 5000,
  ownerToAgentReferredReward: 5000,
  ownerToAgentRewardType: "SERVICE_CREDIT",

  ownerToRenterEnabled: true,
  ownerToRenterReferrerReward: 2000,
  ownerToRenterReferredReward: 2000,
  ownerToRenterRewardType: "SERVICE_CREDIT",

  agentToOwnerEnabled: true,
  agentToOwnerReferrerReward: 7000,
  agentToOwnerReferredReward: 3000,
  agentToOwnerRewardType: "COMMISSION_CREDIT",

  agentToAgentEnabled: true,
  agentToAgentReferrerReward: 3000,
  agentToAgentReferredReward: 3000,
  agentToAgentRewardType: "COMMISSION_CREDIT",

  agentToRenterEnabled: true,
  agentToRenterReferrerReward: 5000,
  agentToRenterReferredReward: 5000,
  agentToRenterRewardType: "RENT_CREDIT",

  renterToRenterEnabled: true,
  renterToRenterReferrerReward: 1000,
  renterToRenterReferredReward: 1000,
  renterToRenterRewardType: "RENT_CREDIT",

  minQualificationAmount: 7000,
  rewardExpiryDays: 90,
  maxReferralsPerUser: 100,
  fraudDetectionEnabled: true,
  autoApproveRewards: false,
  termsAndConditions: "",
};

export default function ReferralSettingsForm() {
  const [settings, setSettings] = useState<ReferralSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await referralAdminAPI.getSettings();
      setSettings(response.data || defaultSettings);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast({
        title: "Error",
        description: "Failed to load referral settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await referralAdminAPI.updateSettings(settings);
      toast({
        title: "Success",
        description: "Referral settings updated successfully",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to update referral settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof ReferralSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Owner-to-Owner Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Owner → Owner Referrals</CardTitle>
          <CardDescription>
            Settings for property owner referring other property owners
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="owner-to-owner-enabled">Enable</Label>
            <Switch
              id="owner-to-owner-enabled"
              checked={settings.ownerToOwnerEnabled}
              onCheckedChange={(checked) => updateSetting("ownerToOwnerEnabled", checked)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="owner-to-owner-referrer">Referrer Reward (₦)</Label>
              <Input
                id="owner-to-owner-referrer"
                type="number"
                value={settings.ownerToOwnerReferrerReward}
                onChange={(e) => updateSetting("ownerToOwnerReferrerReward", Number(e.target.value))}
                disabled={!settings.ownerToOwnerEnabled}
              />
            </div>
            <div>
              <Label htmlFor="owner-to-owner-referred">Referred Reward (₦)</Label>
              <Input
                id="owner-to-owner-referred"
                type="number"
                value={settings.ownerToOwnerReferredReward}
                onChange={(e) => updateSetting("ownerToOwnerReferredReward", Number(e.target.value))}
                disabled={!settings.ownerToOwnerEnabled}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="owner-to-owner-type">Reward Type</Label>
            <Select
              value={settings.ownerToOwnerRewardType}
              onValueChange={(value) => updateSetting("ownerToOwnerRewardType", value)}
              disabled={!settings.ownerToOwnerEnabled}
            >
              <SelectTrigger id="owner-to-owner-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SERVICE_CREDIT">Service Credit</SelectItem>
                <SelectItem value="SUBSCRIPTION_DISCOUNT">Subscription Discount</SelectItem>
                <SelectItem value="MAINTENANCE_VOUCHER">Maintenance Voucher</SelectItem>
                <SelectItem value="CASH_REWARD">Cash Reward</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agent-to-Agent Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Agent → Agent Referrals</CardTitle>
          <CardDescription>
            Settings for agents referring other agents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="agent-to-agent-enabled">Enable</Label>
            <Switch
              id="agent-to-agent-enabled"
              checked={settings.agentToAgentEnabled}
              onCheckedChange={(checked) => updateSetting("agentToAgentEnabled", checked)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agent-to-agent-referrer">Referrer Reward (₦)</Label>
              <Input
                id="agent-to-agent-referrer"
                type="number"
                value={settings.agentToAgentReferrerReward}
                onChange={(e) => updateSetting("agentToAgentReferrerReward", Number(e.target.value))}
                disabled={!settings.agentToAgentEnabled}
              />
            </div>
            <div>
              <Label htmlFor="agent-to-agent-referred">Referred Reward (₦)</Label>
              <Input
                id="agent-to-agent-referred"
                type="number"
                value={settings.agentToAgentReferredReward}
                onChange={(e) => updateSetting("agentToAgentReferredReward", Number(e.target.value))}
                disabled={!settings.agentToAgentEnabled}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="agent-to-agent-type">Reward Type</Label>
            <Select
              value={settings.agentToAgentRewardType}
              onValueChange={(value) => updateSetting("agentToAgentRewardType", value)}
              disabled={!settings.agentToAgentEnabled}
            >
              <SelectTrigger id="agent-to-agent-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMMISSION_CREDIT">Commission Credit</SelectItem>
                <SelectItem value="SERVICE_CREDIT">Service Credit</SelectItem>
                <SelectItem value="CASH_REWARD">Cash Reward</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Global configuration for the referral system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-qualification">Min Qualification Amount (₦)</Label>
              <Input
                id="min-qualification"
                type="number"
                value={settings.minQualificationAmount}
                onChange={(e) => updateSetting("minQualificationAmount", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum transaction amount to qualify for rewards
              </p>
            </div>
            <div>
              <Label htmlFor="reward-expiry">Reward Expiry (Days)</Label>
              <Input
                id="reward-expiry"
                type="number"
                value={settings.rewardExpiryDays}
                onChange={(e) => updateSetting("rewardExpiryDays", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Days before unclaimed rewards expire
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="max-referrals">Max Referrals Per User</Label>
            <Input
              id="max-referrals"
              type="number"
              value={settings.maxReferralsPerUser}
              onChange={(e) => updateSetting("maxReferralsPerUser", Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum number of referrals one user can make
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="fraud-detection">Fraud Detection</Label>
              <p className="text-xs text-muted-foreground">
                Enable automated fraud detection
              </p>
            </div>
            <Switch
              id="fraud-detection"
              checked={settings.fraudDetectionEnabled}
              onCheckedChange={(checked) => updateSetting("fraudDetectionEnabled", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-approve">Auto-Approve Rewards</Label>
              <p className="text-xs text-muted-foreground">
                Automatically approve rewards without manual review
              </p>
            </div>
            <Switch
              id="auto-approve"
              checked={settings.autoApproveRewards}
              onCheckedChange={(checked) => updateSetting("autoApproveRewards", checked)}
            />
          </div>

          <div>
            <Label htmlFor="terms">Terms and Conditions</Label>
            <Textarea
              id="terms"
              value={settings.termsAndConditions}
              onChange={(e) => updateSetting("termsAndConditions", e.target.value)}
              rows={6}
              placeholder="Enter referral program terms and conditions..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={loadSettings} disabled={saving}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}