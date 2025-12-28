// apps/admin/src/components/referrals/ReferralTable.tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Referral {
  id: string;
  referrerName: string;
  referredName: string;
  referredEmail: string;
  referralType: string;
  status: string;
  rewardAmount?: number;
  createdAt: string;
}

interface ReferralTableProps {
  referrals: Referral[];
  loading: boolean;
  onRefresh: () => void;
  onRowClick?: (referral: Referral) => void;
}

export default function ReferralTable({
  referrals,
  loading,
  onRefresh,
  onRowClick,
}: ReferralTableProps) {
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "QUALIFIED":
        return "bg-blue-100 text-blue-800";
      case "REWARDED":
        return "bg-green-100 text-green-800";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No referrals found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Referrer</TableHead>
            <TableHead>Referred User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reward</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {referrals.map((referral) => (
            <TableRow
              key={referral.id}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              onClick={() => onRowClick?.(referral)}
            >
              <TableCell className="font-medium">{referral.referrerName}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{referral.referredName}</p>
                  <p className="text-xs text-muted-foreground">
                    {referral.referredEmail}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {referral.referralType.replace(/_/g, " → ")}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(referral.status)}>
                  {referral.status}
                </Badge>
              </TableCell>
              <TableCell>
                {referral.rewardAmount ? (
                  <span className="font-semibold">
                    ₦{referral.rewardAmount.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(referral.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onRowClick?.(referral)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}