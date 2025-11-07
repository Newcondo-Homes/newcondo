'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface AgentPerformanceChartProps {
    dateRange?: { from: Date; to: Date };
}

export default function AgentPerformanceChart({ dateRange }: AgentPerformanceChartProps) {
    const { data: agentData, isLoading } = useQuery({
        queryKey: ['analytics-agents', dateRange],
        queryFn: async () => {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/admin/analytics/agents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dateRange }),
            });
            return response.json();
        },
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Agent Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-80" />
                </CardContent>
            </Card>
        );
    }

    // Mock data - replace with actual data
    const mockData = [
        { month: 'Jan', activeAgents: 2850, listings: 1240, commissions: 980000, avgRating: 4.5 },
        { month: 'Feb', activeAgents: 2920, listings: 1350, commissions: 1120000, avgRating: 4.6 },
        { month: 'Mar', activeAgents: 3010, listings: 1420, commissions: 1280000, avgRating: 4.6 },
        { month: 'Apr', activeAgents: 3080, listings: 1380, commissions: 1150000, avgRating: 4.5 },
        { month: 'May', activeAgents: 3150, listings: 1480, commissions: 1340000, avgRating: 4.7 },
        { month: 'Jun', activeAgents: 3220, listings: 1560, commissions: 1420000, avgRating: 4.7 },
        { month: 'Jul', activeAgents: 3280, listings: 1520, commissions: 1380000, avgRating: 4.6 },
        { month: 'Aug', activeAgents: 3340, listings: 1620, commissions: 1480000, avgRating: 4.7 },
        { month: 'Sep', activeAgents: 3390, listings: 1580, commissions: 1440000, avgRating: 4.7 },
        { month: 'Oct', activeAgents: 3456, listings: 1680, commissions: 1560000, avgRating: 4.7 },
    ];
    return (
        <Card>
            <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>Agent activity, listings, and commission trends</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={mockData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                            formatter={(value: any, name: string) => {
                                if (name === 'Commission') return ₦${value.toLocaleString()};
                        if (name === 'Avg Rating') return value.toFixed(1);
                        return value;
}}
/>
                        <Legend />
                        <Bar yAxisId="left" dataKey="activeAgents" fill="#8884d8" name="Active Agents" />
                        <Bar yAxisId="left" dataKey="listings" fill="#82ca9d" name="Listings" />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="avgRating"
                            stroke="#ffc658"
                            strokeWidth={2}
                            name="Avg Rating"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}