import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { 
  Users, 
  Home, 
  DollarSign, 
  FileCheck, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import DashboardStatsCard from '@/components/admin/DashboardStatsCard';
import RecentActivityTable from '@/components/admin/RecentActivityTable';
import QuickActionsGrid from '@/components/admin/QuickActionsGrid';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'dashboard.overview' });

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

// Fetch dashboard stats (would come from analytics service)
async function getDashboardStats() {
  // TODO: Implement actual API call to analytics service
  return {
    totalUsers: 1247,
    userGrowth: 12.5,
    totalProperties: 856,
    propertyGrowth: 8.3,
    totalRevenue: 45678900,
    revenueGrowth: 15.7,
    pendingVerifications: 23,
    verificationChange: -5,
    activeRentals: 342,
    rentalGrowth: 6.2,
    pendingApprovals: 15,
    approvalChange: 3,
    totalPayments: 1523,
    paymentGrowth: 11.4,
    supportTickets: 8,
    ticketChange: -2,
  };
}

// Fetch recent activity (would come from admin service)
async function getRecentActivity() {
  // TODO: Implement actual API call to admin service
  return [
    {
      id: '1',
      type: 'USER_VERIFIED',
      description: 'User John Doe verified successfully',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      status: 'success',
    },
    {
      id: '2',
      type: 'PROPERTY_APPROVED',
      description: 'Property "Modern 2BR Apartment" approved',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'success',
    },
    {
      id: '3',
      type: 'PAYMENT_PROCESSED',
      description: 'Payment of ₦500,000 processed',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      status: 'success',
    },
    {
      id: '4',
      type: 'DUPLICATE_REPORTED',
      description: 'Duplicate property reported - needs review',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      status: 'warning',
    },
    {
      id: '5',
      type: 'SUPPORT_TICKET',
      description: 'New support ticket from Jane Smith',
      timestamp: new Date(Date.now() - 1000 * 60 * 90),
      status: 'info',
    },
  ];
}

export default async function AdminDashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'dashboard.overview' });
  const stats = await getDashboardStats();
  const recentActivity = await getRecentActivity();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('title')}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatsCard
          title={t('stats.totalUsers')}
          value={stats.totalUsers.toLocaleString()}
          change={stats.userGrowth}
          icon={Users}
          locale={locale}
        />
        <DashboardStatsCard
          title={t('stats.totalProperties')}
          value={stats.totalProperties.toLocaleString()}
          change={stats.propertyGrowth}
          icon={Home}
          locale={locale}
        />
        <DashboardStatsCard
          title={t('stats.totalRevenue')}
          value={`₦${(stats.totalRevenue / 1000000).toFixed(1)}M`}
          change={stats.revenueGrowth}
          icon={DollarSign}
          locale={locale}
        />
        <DashboardStatsCard
          title={t('stats.pendingVerifications')}
          value={stats.pendingVerifications.toLocaleString()}
          change={stats.verificationChange}
          icon={FileCheck}
          locale={locale}
          variant="warning"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatsCard
          title={t('stats.activeRentals')}
          value={stats.activeRentals.toLocaleString()}
          change={stats.rentalGrowth}
          icon={CheckCircle}
          locale={locale}
        />
        <DashboardStatsCard
          title={t('stats.pendingApprovals')}
          value={stats.pendingApprovals.toLocaleString()}
          change={stats.approvalChange}
          icon={Clock}
          locale={locale}
          variant="warning"
        />
        <DashboardStatsCard
          title={t('stats.totalPayments')}
          value={stats.totalPayments.toLocaleString()}
          change={stats.paymentGrowth}
          icon={TrendingUp}
          locale={locale}
        />
        <DashboardStatsCard
          title={t('stats.supportTickets')}
          value={stats.supportTickets.toLocaleString()}
          change={stats.ticketChange}
          icon={AlertCircle}
          locale={locale}
          variant={stats.ticketChange > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('quickActions.title')}
        </h2>
        <QuickActionsGrid locale={locale} />
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('recentActivity.title')}
        </h2>
        <RecentActivityTable activities={recentActivity} locale={locale} />
      </div>
    </div>
  );
}