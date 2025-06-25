// apps/platform/components/shared/layouts/DashboardLayout.tsx
'use client';

import { useState } from 'react';
// import { User } from '@newcondo/auth';
import type { Role, VerificationStatus } from '@newcondo/db'

import { useRouter } from 'next/navigation';
import { Button } from '@newcondo/ui/';
import { Avatar, AvatarFallback, AvatarImage } from '@newcondo/ui/';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@newcondo/ui/';
import { Sheet, SheetContent, SheetTrigger } from '@newcondo/ui/';
import { Badge } from '@newcondo/ui/';
import { 
  Home, 
  Building, 
  // CreditCard, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  Bell,
  Shield,
  MapPin,
  Briefcase
} from 'lucide-react';
import { signOut } from '@newcondo/auth/client';
import Sidebar from '@/components/shared/navigation/Sidebar';


// The dashboard type below initially pulled alot of user data as the 'User' type from
// the database suggest. the thing is, is it efficient to get all the 'User' data at once
// when the user visits their dashboard or just get a handle-full of the user's data.

// For now I'm getting a hand-full and will adjust it as need be until we get to a
// situation where we need all the user data. for now we get what we need.

// interface DashboardLayoutProps {
//   children: React.ReactNode;
//   user: User & {
//     role: 'OWNER' | 'AGENT' | 'RENTER' | 'ADMIN';
//     verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
//     isAvailableForMarking?: boolean;
//   };
// }

// Minimal user type for layout purposes
interface DashboardUser {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  image?: string | null;
  phone?: string | null;
  verificationStatus: VerificationStatus;
  isAvailableForMarking?: boolean
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: DashboardUser;
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: '/',
      redirect: true
    });
  };

  const getVerificationBadge = () => {
    switch (user.verificationStatus) {
      case 'VERIFIED':
        return <Badge variant="default" className="text-xs">Verified</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="text-xs">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
      default:
        return null;
    }
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case 'OWNER':
        return <Building className="h-4 w-4" />;
      case 'AGENT':
        return <Briefcase className="h-4 w-4" />;
      case 'RENTER':
        return <Home className="h-4 w-4" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar user={user} />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <Sidebar user={user} onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                      <AvatarFallback>
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getRoleIcon()}
                        <span className="text-xs text-muted-foreground capitalize">
                          {user.role.toLowerCase()}
                        </span>
                        {getVerificationBadge()}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Profile & Settings
                  </DropdownMenuItem>
                  {user.role === 'AGENT' && (
                    <DropdownMenuItem onClick={() => router.push('/marking-jobs/queue')}>
                      <MapPin className="mr-2 h-4 w-4" />
                      Agent Queue
                      {user.isAvailableForMarking && (
                        <Badge variant="default" className="ml-auto text-xs">
                          Available
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}