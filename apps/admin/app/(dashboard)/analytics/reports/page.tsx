import { Suspense } from 'react';
import { Metadata } from 'next';
import DateRangeFilter from '@/components/analytics/DateRangeFilter';
import ExportOptions from '@/components/analytics/ExportOptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Calendar, TrendingUp, Users, Building2, DollarSign, Activity } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Reports | Newcondo Admin',
    description: 'Generate and download platform reports',
};

export default function ReportsPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground">
                        Generate comprehensive reports for analysis and compliance
                    </p>
                </div>
                <div className="flex gap-2">
                    <DateRangeFilter />
                    <ExportOptions />
                </div>
            </div>

            {/* Quick Report Generation */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue Report</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" size="sm" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Generate
                        </Button>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">User Report</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" size="sm" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Generate
                        </Button>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Property Report</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" size="sm" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Generate
                        </Button>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transaction Report</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" size="sm" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Generate
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Scheduled Reports */}
            <Card>
                <CardHeader>
                    <CardTitle>Scheduled Reports</CardTitle>
                    <CardDescription>Automatically generated reports</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <h4 className="font-medium">Monthly Revenue Report</h4>
                                    <p className="text-sm text-muted-foreground">Generated on the 1st of each month</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download Latest
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <h4 className="font-medium">Weekly User Activity</h4>
                                    <p className="text-sm text-muted-foreground">Generated every Monday</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download Latest
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <h4 className="font-medium">Quarterly Performance Report</h4>
                                    <p className="text-sm text-muted-foreground">Generated quarterly</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download Latest
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Custom Report Builder */}
            <Card>
                <CardHeader>
                    <CardTitle>Custom Report Builder</CardTitle>
                    <CardDescription>Create custom reports with specific metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Report Name</label>
                            <input
                                type="text"
                                placeholder="Enter report name"
                                className="w-full mt-1 px-3 py-2 border rounded-md"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Select Metrics</label>
                            <div className="grid gap-2 mt-2">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" />
                                    <span className="text-sm">Total Revenue</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" />
                                    <span className="text-sm">New Users</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" />
                                    <span className="text-sm">Property Listings</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" />
                                    <span className="text-sm">Transaction Volume</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" />
                                    <span className="text-sm">Agent Performance</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button>
                                <FileText className="h-4 w-4 mr-2" />
                                Generate Report
                            </Button>
                            <Button variant="outline">
                                Save Template
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Reports</CardTitle>
                    <CardDescription>Previously generated reports</CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<Skeleton className="h-64" />}>
                        <div className="space-y-3">
                            <ReportRow
                                name="October 2024 Revenue Report"
                                type="Revenue"
                                date="Nov 1, 2024"
                                size="2.4 MB"
                            />
                            <ReportRow
                                name="Q3 2024 Performance Report"
                                type="Performance"
                                date="Oct 1, 2024"
                                size="5.1 MB"
                            />
                            <ReportRow
                                name="September User Activity"
                                type="User Activity"
                                date="Oct 1, 2024"
                                size="1.8 MB"
                            />
                            <ReportRow
                                name="Agent Commission Report - Sept"
                                type="Commission"
                                date="Oct 1, 2024"
                                size="3.2 MB"
                            />
                            <ReportRow
                                name="Property Listings Report"
                                type="Properties"
                                date="Sep 25, 2024"
                                size="4.5 MB"
                            />
                        </div>
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}

function ReportRow({
    name,
    type,
    date,
    size
}: {
    name: string;
    type: string;
    date: string;
    size: string;
}) {
    return (
        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                    <h4 className="font-medium text-sm">{name}</h4>
                    <p className="text-xs text-muted-foreground">{type} • {date} • {size}</p>
                </div>
            </div>
            <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
            </Button>
        </div>
    );
}