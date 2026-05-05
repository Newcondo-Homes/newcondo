// apps/platform/app/(dashboard)/referrals/leaderboard/page.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Avatar, AvatarFallback} from '@newcondo/ui/components/avatar';
import { useReferralLeaderboard } from '@/hooks/useReferrals';
import { formatCurrency } from '@/lib/utils/referralHelpers';
import { Trophy, Medal, Award, Crown, User } from 'lucide-react';
import { Skeleton } from '@newcondo/ui/components/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/components/select';

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const { leaderboard, userRank, isLoading } = useReferralLeaderboard({ period });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <Trophy className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">
            Top referrers on NewCondo
          </p>
        </div>

        {/* fix line 41: replaced `any` with the period union type */}
        <Select value={period} onValueChange={(v: 'week' | 'month' | 'year' | 'all') => setPeriod(v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User's Rank Card */}
      {userRank && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-blue-600">
                  #{userRank}
                </div>
                <div>
                  <p className="font-medium">Your Rank</p>
                  <p className="text-sm text-muted-foreground">
                    Keep inviting to climb higher!
                  </p>
                </div>
              </div>
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No leaderboard data yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-12">
                      {getRankIcon(entry.rank)}
                      <span className="font-semibold text-lg">
                        {entry.rank}
                      </span>
                    </div>

                    <Avatar>
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="font-medium">{entry.userName}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {entry.userRole.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      {entry.totalReferrals} referrals
                    </p>
                    <p className="text-sm text-green-600">
                      {formatCurrency(entry.totalEarnings)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}