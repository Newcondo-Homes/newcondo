"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@newcondo/ui/table";
import { Button } from "@newcondo/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@newcondo/ui/avatar";
import { Badge } from "@newcondo/ui/badge";
import { Eye, MoreVertical, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@newcondo/ui/dropdown-menu";
import { Input } from "@newcondo/ui/input";
import { UserStatusBadge } from "./UserStatusBadge";
import { adminApi } from "@/lib/api/admin";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  role: string;
  verificationStatus: string;
  createdAt: string;
  isPremium: boolean;
  totalProperties?: number;
  isAvailableForMarking?: boolean;
}

interface UserTableProps {
  filters?: {
    role?: string;
    verificationStatus?: string;
    search?: string;
  };
}

export function UserTable({ filters }: UserTableProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchUsers();
  }, [filters, searchQuery, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers({
        ...filters,
        search: searchQuery,
        page: currentPage,
        limit: pageSize,
      });
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleSuspendUser = async (userId: string) => {
    if (confirm("Are you sure you want to suspend this user?")) {
      try {
        await adminApi.suspendUser(userId);
        fetchUsers();
      } catch (error) {
        console.error("Failed to suspend user:", error);
      }
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await adminApi.activateUser(userId);
      fetchUsers();
    } catch (error) {
      console.error("Failed to activate user:", error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "OWNER":
        return "bg-blue-100 text-blue-800";
      case "AGENT":
        return "bg-purple-100 text-purple-800";
      case "RENTER":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse bg-gray-200 rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 w-full animate-pulse bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image} />
                        <AvatarFallback>
                          {user.name?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        {user.isPremium && (
                          <Badge variant="secondary" className="text-xs">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{user.email}</p>
                      {user.phone && (
                        <p className="text-muted-foreground">{user.phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                    {user.isAvailableForMarking && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        Marker
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge status={user.verificationStatus} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user.totalProperties || 0}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSuspendUser(user.id)}>
                          Suspend User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleActivateUser(user.id)}>
                          Activate User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}