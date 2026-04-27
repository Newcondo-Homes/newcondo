// apps/platform/app/(dashboard)/referrals/invite/page.tsx

import { Metadata } from 'next';
import { ReferralInviteForm } from '@/components/referrals/ReferralInviteForm';
import { ReferralLink } from '@/components/referrals/ReferralLink';
import { SocialShareButtons } from '@/components/referrals/SocialShareButtons';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/';
import { Gift, Users, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Invite Friends | NewCondo',
  description: 'Invite friends to NewCondo and earn rewards',
};

export default function InvitePage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invite Friends</h1>
        <p className="text-muted-foreground mt-1">
          Share NewCondo with your network and earn rewards
        </p>
      </div>

      {/* Benefits Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <Gift className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle className="text-base">Earn Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get up to ₦10,000 for every qualified referral
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle className="text-base">Help Friends</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              They get rewards too when they join and subscribe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle className="text-base">Unlock Bonuses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Reach milestones for extra bonus rewards
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ReferralLink />
          <SocialShareButtons />
        </div>

        <div>
          <ReferralInviteForm />
        </div>
      </div>
    </div>
  );
}

// // apps/platform/app/(dashboard)/referrals/rewards/page.tsx

// import { Metadata } from 'next';
// import { RewardsList } from '@/components/referrals/RewardsList';
// import { RewardTiers } from '@/components/referrals/RewardTiers';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { useRewardsSummary } from '@/hooks/useRewards';
// import { formatCurrency } from '@/lib/utils/referralHelpers';
// import { Wallet, Clock, CheckCircle, XCircle } from 'lucide-react';

// export const metadata: Metadata = {
//   title: 'My Rewards | NewCondo',
//   description: 'View and manage your referral rewards',
// };

// function RewardsSummaryCards() {
//   const { summary } = useRewardsSummary();

//   const cards = [
//     {
//       title: 'Total Rewards',
//       value: formatCurrency(summary?.totalValue || 0),
//       icon: Wallet,
//       color: 'text-blue-600',
//     },
//     {
//       title: 'Available Balance',
//       value: formatCurrency(summary?.availableBalance || 0),
//       icon: CheckCircle,
//       color: 'text-green-600',
//     },
//     {
//       title: 'Pending Approval',
//       value: formatCurrency(summary?.lockedBalance || 0),
//       icon: Clock,
//       color: 'text-yellow-600',
//     },
//   ];

//   return (
//     <div className="grid gap-4 md:grid-cols-3">
//       {cards.map((card, index) => {
//         const Icon = card.icon;
//         return (
//           <Card key={index}>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">
//                 {card.title}
//               </CardTitle>
//               <Icon className={`h-4 w-4 ${card.color}`} />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{card.value}</div>
//             </CardContent>
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// export default function RewardsPage() {
//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-3xl font-bold tracking-tight">My Rewards</h1>
//         <p className="text-muted-foreground mt-1">
//           View and redeem your referral rewards
//         </p>
//       </div>

//       <RewardsSummaryCards />

//       <div className="grid gap-6 lg:grid-cols-3">
//         <div className="lg:col-span-2">
//           <RewardsList />
//         </div>

//         <div>
//           <RewardTiers />
//         </div>
//       </div>
//     </div>
//   );
// }

// // apps/platform/app/(dashboard)/referrals/leaderboard/page.tsx

// 'use client';

// import { useState } from 'react';
// import { Metadata } from 'next';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Badge } from '@/components/ui/badge';
// import { useReferralLeaderboard } from '@/hooks/useReferrals';
// import { formatCurrency } from '@/lib/utils/referralHelpers';
// import { Trophy, Medal, Award, Crown, User } from 'lucide-react';
// import { Skeleton } from '@/components/ui/skeleton';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';

// export default function LeaderboardPage() {
//   const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
//   const { leaderboard, userRank, isLoading } = useReferralLeaderboard({ period });

//   const getRankIcon = (rank: number) => {
//     if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
//     if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
//     if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
//     return <Trophy className="h-5 w-5 text-gray-400" />;
//   };

//   return (
//     <div className="space-y-8 max-w-4xl mx-auto">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
//           <p className="text-muted-foreground mt-1">
//             Top referrers on NewCondo
//           </p>
//         </div>

//         <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
//           <SelectTrigger className="w-[150px]">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="week">This Week</SelectItem>
//             <SelectItem value="month">This Month</SelectItem>
//             <SelectItem value="year">This Year</SelectItem>
//             <SelectItem value="all">All Time</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {/* User's Rank Card */}
//       {userRank && (
//         <Card className="border-blue-200 bg-blue-50">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="text-2xl font-bold text-blue-600">
//                   #{userRank}
//                 </div>
//                 <div>
//                   <p className="font-medium">Your Rank</p>
//                   <p className="text-sm text-muted-foreground">
//                     Keep inviting to climb higher!
//                   </p>
//                 </div>
//               </div>
//               <Trophy className="h-8 w-8 text-blue-600" />
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Leaderboard */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Top Referrers</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {isLoading ? (
//             <div className="space-y-4">
//               {[...Array(10)].map((_, i) => (
//                 <Skeleton key={i} className="h-16 w-full" />
//               ))}
//             </div>
//           ) : leaderboard.length === 0 ? (
//             <div className="text-center py-8">
//               <p className="text-muted-foreground">No leaderboard data yet</p>
//             </div>
//           ) : (
//             <div className="space-y-2">
//               {leaderboard.map((entry) => (
//                 <div
//                   key={entry.userId}
//                   className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
//                 >
//                   <div className="flex items-center gap-4">
//                     <div className="flex items-center gap-2 w-12">
//                       {getRankIcon(entry.rank)}
//                       <span className="font-semibold text-lg">
//                         {entry.rank}
//                       </span>
//                     </div>

//                     <Avatar>
//                       <AvatarFallback>
//                         <User className="h-4 w-4" />
//                       </AvatarFallback>
//                     </Avatar>

//                     <div>
//                       <p className="font-medium">{entry.userName}</p>
//                       <p className="text-sm text-muted-foreground capitalize">
//                         {entry.userRole.toLowerCase()}
//                       </p>
//                     </div>
//                   </div>

//                   <div className="text-right">
//                     <p className="font-semibold">
//                       {entry.totalReferrals} referrals
//                     </p>
//                     <p className="text-sm text-green-600">
//                       {formatCurrency(entry.totalEarnings)}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }