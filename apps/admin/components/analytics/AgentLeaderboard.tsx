'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Agent {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    listings: number;
    rentals: number;
    commission: number;
    rating: number;
    rank: number;
}

export default function AgentLeaderboard() {
    const { data, isLoading } = useQuery({
        queryKey: ['agent-leaderboard'],
        queryFn: async () => {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/admin/analytics/agent-leaderboard`);
            return response.json();
        },
    });

    if (isLoading) {
        return <Skeleton className="h-96" />;
    }

    // Mock data - replace with actual data
    const mockAgents: Agent[] = [
        {
            id: '1',
            name: 'Sarah Williams',
            email: 'sarah.w@example.com',
            listings: 45,
            rentals: 38,
            commission: 580000,
            rating: 4.9,
            rank: 1,
        },
        {
            id: '2',
            name: 'Michael Chen',
            email: 'michael.c@example.com',
            listings: 42,
            rentals: 35,
            commission: 520000,
            rating: 4.8,
            rank: 2,
        },
        {
            id: '3',
            name: 'Jennifer Lopez',
            email: 'jennifer.l@example.com',
            listings: 39,
            rentals: 32,
            commission: 480000,
            rating: 4.8,
            rank: 3,
        },
        {
            id: '4',
            name: 'David Anderson',
            email: 'david.a@example.com',
            listings: 36,
            rentals: 30,
            commission: 450000,
            rating: 4.7,
            rank: 4,
        },
        {
            id: '5',
            name: 'Emma Thompson',
            email: 'emma.t@example.com',
            listings: 34,
            rentals: 28,
            commission: 420000,
            rating: 4.7,
            rank: 5,
        },
    ];

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead className="text-center">Listings</TableHead>
                        <TableHead className="text-center">Rentals</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead className="text-center">Rating</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockAgents.map((agent) => (
                        <TableRow key={agent.id}>
                            <TableCell>
                                <RankBadge rank={agent.rank} />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={agent.avatar} />
                                        <AvatarFallback>
                                            {agent.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{agent.name}</p>
                                        <p className="text-xs text-muted-foreground">{agent.email}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                                {agent.listings}
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                                {agent.rentals}
                            </TableCell>
                            <TableCell className="font-semibold">
                                ₦{agent.commission.toLocaleString()}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                    <span className="font-semibold">{agent.rating}</span>
                                    <span className="text-yellow-500">★</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <div className="flex items-center justify-center">
                <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
        );
    }
    if (rank === 2) {
        return (
            <div className="flex items-center justify-center">
                <Medal className="h-5 w-5 text-gray-400" />
            </div>
        );
    }
    if (rank === 3) {
        return (
            <div className="flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-600" />
            </div>
        );
    }
    return (
        <div className="flex items-center justify-center">
            <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>
        </div>
    );
}