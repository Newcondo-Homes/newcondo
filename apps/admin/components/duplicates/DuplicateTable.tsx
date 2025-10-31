"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "../shared/StatusBadge";
import ActionMenu from "../shared/ActionMenu";
import Pagination from "../shared/Pagination";
import { Eye, MapPin, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface DuplicateProperty {
  id: string;
  originalPropertyId: string;
  duplicatePropertyId: string;
  originalTitle: string;
  duplicateTitle: string;
  originalOwner: string;
  duplicateOwner: string;
  status: "PENDING" | "CONFIRMED_DUPLICATE" | "NOT_DUPLICATE" | "RESOLVED";
  reportedBy?: string;
  matchScore: number; // 0-100
  location: string;
  createdAt: Date;
}

interface DuplicateTableProps {
  onView: (duplicate: DuplicateProperty) => void;
  onResolve: (duplicate: DuplicateProperty) => void;
}

export default function DuplicateTable({ onView, onResolve }: DuplicateTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Mock data - replace with actual API call
  const duplicates: DuplicateProperty[] = [
    {
      id: "1",
      originalPropertyId: "prop_123",
      duplicatePropertyId: "prop_456",
      originalTitle: "3 Bedroom Flat in Lekki Phase 1",
      duplicateTitle: "Spacious 3BR Apartment - Lekki",
      originalOwner: "John Doe",
      duplicateOwner: "Jane Smith",
      status: "PENDING",
      reportedBy: "System",
      matchScore: 95,
      location: "Lekki, Lagos",
      createdAt: new Date("2025-10-25"),
    },
    {
      id: "2",
      originalPropertyId: "prop_789",
      duplicatePropertyId: "prop_012",
      originalTitle: "2 Bedroom Apartment - Victoria Island",
      duplicateTitle: "Modern 2BR Flat VI",
      originalOwner: "Mike Johnson",
      duplicateOwner: "Sarah Williams",
      status: "PENDING",
      reportedBy: "User",
      matchScore: 88,
      location: "Victoria Island, Lagos",
      createdAt: new Date("2025-10-24"),
    },
  ];

  const totalPages = Math.ceil(duplicates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDuplicates = duplicates.slice(startIndex, startIndex + itemsPerPage);

  const getMatchScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-red-500">High Match ({score}%)</Badge>;
    if (score >= 75) return <Badge className="bg-orange-500">Medium Match ({score}%)</Badge>;
    return <Badge className="bg-yellow-500">Low Match ({score}%)</Badge>;
  };

  const getStatusVariant = (status: string): "default" | "success" | "warning" | "danger" => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "CONFIRMED_DUPLICATE":
        return "danger";
      case "NOT_DUPLICATE":
        return "success";
      case "RESOLVED":
        return "default";
      default:
        return "default";
    }
  };

  const actions = [
    {
      label: "View Details",
      icon: Eye,
      onClick: (duplicate: DuplicateProperty) => onView(duplicate),
    },
    {
      label: "View on Map",
      icon: MapPin,
      onClick: (duplicate: DuplicateProperty) => {
        console.log("View on map:", duplicate.id);
      },
    },
    {
      label: "Resolve Duplicate",
      icon: AlertTriangle,
      onClick: (duplicate: DuplicateProperty) => onResolve(duplicate),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Properties</TableHead>
              <TableHead>Owners</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Match Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDuplicates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No duplicate properties found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedDuplicates.map((duplicate) => (
                <TableRow key={duplicate.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{duplicate.originalTitle}</p>
                      <p className="text-xs text-muted-foreground">{duplicate.duplicateTitle}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">{duplicate.originalOwner}</p>
                      <p className="text-xs text-muted-foreground">{duplicate.duplicateOwner}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{duplicate.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getMatchScoreBadge(duplicate.matchScore)}</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={duplicate.status}
                      variant={getStatusVariant(duplicate.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {duplicate.reportedBy || "System"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(duplicate.createdAt, "MMM dd, yyyy")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionMenu item={duplicate} actions={actions} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}