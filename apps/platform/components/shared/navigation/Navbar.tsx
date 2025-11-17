'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, X, User, Heart, Bell, Settings, LogOut } from 'lucide-react';
import { Button } from '@newcondo/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@newcondo/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@newcondo/ui/dropdown-menu';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@newcondo/ui/utils';

interface NavbarProps {
  className?: string;
  transparent?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ className, transparent = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle scroll effect for transparent navbar
  useEffect(() => {
    if (!transparent) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparent]);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const navLinks = [
    { href: '/properties', label: 'Properties' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const isTransparentAndNotScrolled = transparent && !isScrolled;

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        isTransparentAndNotScrolled
          ? 'bg-transparent'
          : 'bg-white border-b border-gray-200 shadow-sm',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative h-8 w-8">
              <Image
                src="/images/logos/newcondo-icon.svg"
                alt="Newcondo"
                fill
                className="object-contain"
              />
            </div>
            <span
              className={cn(
                'text-xl font-bold transition-colors',
                isTransparentAndNotScrolled ? 'text-white' : 'text-gray-900'
              )}
            >
              Newcondo
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-blue-600',
                  isTransparentAndNotScrolled
                    ? 'text-white hover:text-blue-200'
                    : 'text-gray-700 hover:text-blue-600'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : session ? (
              <>
                {/* Authenticated user menu */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'hidden md:flex',
                    isTransparentAndNotScrolled
                      ? 'text-white hover:bg-white/10'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Favorites
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                        <AvatarFallback>
                          {session.user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {session.user?.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/favorites')}>
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Favorites</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Unauthenticated user actions */}
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className={cn(
                      'hidden md:inline-flex',
                      isTransparentAndNotScrolled
                        ? 'text-white hover:bg-white/10'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    className={cn(
                      'hidden md:inline-flex',
                      isTransparentAndNotScrolled
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    )}
                  >
                    Sign up
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'md:hidden',
                isTransparentAndNotScrolled
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/favorites"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Favorites
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;


















// 'use client';

// import { useTranslations } from 'next-intl';
// import Link from 'next/link';
// import { useSession, signOut } from 'next-auth/react';
// import { Button } from '@/components/ui/button';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
// import { Bell, User, Settings, LogOut, Home } from 'lucide-react';

// interface NavbarProps {
//   locale: string;
// }

// export function Navbar({ locale }: NavbarProps) {
//   const t = useTranslations('navigation');
//   const { data: session } = useSession();

//   const getInitials = (name?: string | null) => {
//     if (!name) return 'U';
//     return name
//       .split(' ')
//       .map((n) => n[0])
//       .join('')
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   return (
//     <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
//       <div className="container flex h-16 items-center justify-between px-4">
//         {/* Logo */}
//         <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
//           <Home className="h-6 w-6 text-primary" />
//           <span className="text-xl font-bold">Newcondo</span>
//         </Link>

//         {/* Right side actions */}
//         <div className="flex items-center gap-4">
//           {/* Language Switcher */}
//           <LanguageSwitcher />

//           {/* Notifications */}
//           <Button variant="ghost" size="icon" className="relative">
//             <Bell className="h-5 w-5" />
//             <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
//               3
//             </span>
//           </Button>

//           {/* User Menu */}
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="ghost" className="relative h-10 w-10 rounded-full">
//                 <Avatar className="h-10 w-10">
//                   <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
//                   <AvatarFallback>{getInitials(session?.user?.name)}</AvatarFallback>
//                 </Avatar>
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-56">
//               <DropdownMenuLabel className="font-normal">
//                 <div className="flex flex-col space-y-1">
//                   <p className="text-sm font-medium leading-none">
//                     {session?.user?.name || 'User'}
//                   </p>
//                   <p className="text-xs leading-none text-muted-foreground">
//                     {session?.user?.email}
//                   </p>
//                 </div>
//               </DropdownMenuLabel>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem asChild>
//                 <Link href={`/${locale}/profile`} className="cursor-pointer">
//                   <User className="mr-2 h-4 w-4" />
//                   <span>{t('profile')}</span>
//                 </Link>
//               </DropdownMenuItem>
//               <DropdownMenuItem asChild>
//                 <Link href={`/${locale}/profile/settings`} className="cursor-pointer">
//                   <Settings className="mr-2 h-4 w-4" />
//                   <span>{t('settings')}</span>
//                 </Link>
//               </DropdownMenuItem>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem
//                 onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
//                 className="cursor-pointer text-destructive focus:text-destructive"
//               >
//                 <LogOut className="mr-2 h-4 w-4" />
//                 <span>{t('logout')}</span>
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </div>
//     </header>
//   );
// }