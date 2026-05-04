// apps/platform/components/shared/navigation/Sidebar.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Role, VerificationStatus } from '@/types/enums';
import { cn } from '@newcondo/ui/';
import { Button } from '@newcondo/ui/';
import { Badge } from '@newcondo/ui/';
import { 
  Home, 
  Building, 
  CreditCard, 
  // Users, 
  Settings, 
  Shield,
  MapPin,
  Briefcase,
  UserCheck,
  Gift,
  PiggyBank,
  // BarChart3
} from 'lucide-react';


// The sidebare type below initially pulled alot of user data as the 'User' type from
// the database suggest. the thing is, is it efficient to get all the 'User' data at once
// when the user visits their dashboard or just get a handle-full of the user's data.

// For now I'm getting a hand-full and will adjust it as need be until we get to a
// situation where we need all the user data. for now we get what we need.


// interface SidebarProps {
//   user: User & {
//     role: 'OWNER' | 'AGENT' | 'RENTER' | 'ADMIN';
//     verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
//     isAvailableForMarking?: boolean;
//   };
//   onNavigate?: () => void;
// }

// Minimal user type for layout purposes
interface SidebarUser {
  id: string;
  email: string;
  name?: string | null | undefined;
  role: Role;
  image?: string | null | undefined;
  phone?: string | null | undefined;
  verificationStatus: VerificationStatus;
  isAvailableForMarking?: boolean
}

interface SidebarProps {
  user: SidebarUser;
  onNavigate?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: Array<'OWNER' | 'AGENT' | 'RENTER' | 'ADMIN'>;
  requireVerification?: boolean;
}

export default function Sidebar({ user, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'Properties',
      href: '/properties',
      icon: Building,
    },
    {
      name: 'My Listings',
      href: '/properties/my-listings',
      icon: Building,
      roles: ['OWNER', 'AGENT'],
      requireVerification: true,
    },
    {
      name: 'Create Listing',
      href: '/properties/create',
      icon: Building,
      roles: ['OWNER', 'AGENT'],
      requireVerification: true,
    },
    {
      name: 'Marking Jobs',
      href: '/marking-jobs',
      icon: MapPin,
      roles: ['OWNER', 'AGENT'],
    },
    {
      name: 'Agent Queue',
      href: '/marking-jobs/queue',
      icon: Briefcase,
      roles: ['AGENT'],
      badge: user.isAvailableForMarking ? 'Available' : undefined,
    },
    {
      name: 'Payments',
      href: '/payments',
      icon: CreditCard,
    },
    {
      name: 'Virtual Accounts',
      href: '/virtual-accounts',
      icon: PiggyBank,
      roles: ['OWNER', 'AGENT'],
    },
    {
      name: 'Referrals',
      href: '/referrals',
      icon: Gift,
    },
    {
      name: 'Admin Panel',
      href: '/admin',
      icon: Shield,
      roles: ['ADMIN'],
    },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  const isItemVisible = (item: NavItem): boolean => {
    // Check role permissions
    if (item.roles && !item.roles.includes(user.role)) {
      return false;
    }

    // Check verification requirements
    if (item.requireVerification && user.verificationStatus !== 'VERIFIED') {
      return false;
    }

    return true;
  };

  const isItemDisabled = (item: NavItem): boolean => {
    // Disable items that require verification for unverified users
    if (item.requireVerification && user.verificationStatus !== 'VERIFIED') {
      return true;
    }

    return false;
  };

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-2">
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center gap-2">
          <Building className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">NewCondo</span>
        </div>
      </div>

      {/* User info card */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {user.role === 'OWNER' && <Building className="h-5 w-5 text-blue-600" />}
            {user.role === 'AGENT' && <Briefcase className="h-5 w-5 text-green-600" />}
            {user.role === 'RENTER' && <Home className="h-5 w-5 text-purple-600" />}
            {user.role === 'ADMIN' && <Shield className="h-5 w-5 text-red-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role?.toLowerCase()}
            </p>
          </div>
          <div>
            {user.verificationStatus === 'VERIFIED' && (
              <Badge variant="default" className="text-xs">
                <UserCheck className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {user.verificationStatus === 'PENDING' && (
              <Badge variant="destructive" className="text-xs">
                Pending
              </Badge>
            )}
            {user.verificationStatus === 'REJECTED' && (
              <Badge variant="destructive" className="text-xs">
                Rejected
              </Badge>
            )}
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation
                .filter(isItemVisible)
                .map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const isDisabled = isItemDisabled(item);
                  
                  return (
                    <li key={item.name}>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start gap-x-3',
                          isActive && 'bg-gray-50 text-blue-600',
                          isDisabled && 'opacity-50 cursor-not-allowed'
                        )}
                        onClick={() => !isDisabled && handleNavigation(item.href)}
                        disabled={isDisabled}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <Badge 
                            variant={item.badge === 'Available' ? 'default' : 'secondary'} 
                            className="ml-auto text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    </li>
                  );
                })}
            </ul>
          </li>

          {/* Bottom navigation */}
          <li className="mt-auto">
            <ul role="list" className="-mx-2 space-y-1">
              <li>
                <Button
                  variant={pathname === '/profile' ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-x-3',
                    pathname === '/profile' && 'bg-gray-50 text-blue-600'
                  )}
                  onClick={() => handleNavigation('/profile')}
                >
                  <Settings className="h-5 w-5 shrink-0" />
                  Profile & Settings
                  {user.verificationStatus === 'PENDING' && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      !
                    </Badge>
                  )}
                </Button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}