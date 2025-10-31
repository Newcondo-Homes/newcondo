"use client";

import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export default function Header({ sidebarOpen, onSidebarToggle }: HeaderProps) {
  const notificationCount = 5;

  return (
    <header className="sticky top-0 z-30 bg-white border-b h-16 flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" onClick={onSidebarToggle}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search Bar */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search users, properties, transactions..."
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-sm">New user registration</span>
                  <span className="text-xs text-muted-foreground">2m ago</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  John Doe has registered and needs verification
                </p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-sm">Property approval pending</span>
                  <span className="text-xs text-muted-foreground">15m ago</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  New property listing awaits your review
                </p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-sm">Duplicate detected</span>
                  <span className="text-xs text-muted-foreground">1h ago</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Potential duplicate property found in Lagos
                </p>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center justify-center text-blue-600 cursor-pointer">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Admin Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full" />
              <span className="hidden md:inline">Admin User</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}