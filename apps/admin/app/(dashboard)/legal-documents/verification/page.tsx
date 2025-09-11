"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Button } from "@newcondo/ui/components/button";
import { Badge } from "@newcondo/ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/components/tabs";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  AlertTriangle,
  Filter,
  Search,
  Download,
  User,
  Calendar,
  Building
} from "lucide-react";
import { Input } from "@newcondo/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@newcondo/ui/components/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/components/select";
import { Avatar, AvatarFallback, AvatarImage } from "@newcondo/ui/components/avatar";

interface DocumentVerification {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  propertyId?: string;
  propertyTitle?: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  category: "IDENTITY" | "PROPERTY" | "BUSINESS" | "COMPLIANCE";
}

interface VerificationStats {
  pending: number;
  approved: number;
  rejected: number;
  totalToday: number;
  averageReviewTime: number;
}

export default function DocumentVerificationPage() {
  const [verifications, setVerifications] = useState<DocumentVerification[]>([]);
  const [stats, setStats] = useState<VerificationStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalToday: 0,
    averageReviewTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchVerifications();
    fetchStats();
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API
      const mockVerifications: DocumentVerification[] = [
        {
          id: "1",
          documentId: "doc_001",
          userId: "user_001",
          userName: "John Doe",
          userEmail: "john.doe@email.com",
          userAvatar: "",
          propertyId: "prop_001",
          propertyTitle: "3 Bedroom Apartment in Victoria Island",
          documentType: "OWNERSHIP_DOCUMENT",
          documentName: "Certificate_of_Occupancy.pdf",
          documentUrl: "/documents/doc_001.pdf",
          status: "PENDING",
          submittedAt: "2024-02-15T10:30:00Z",
          priority: "HIGH",
          category: "PROPERTY"
        },
        {
          id: "2",
          documentId: "doc_002", 
          userId: "user_002",
          userName: "Jane Smith",
          userEmail: "jane.smith@email.com",
          documentType: "NIN",
          documentName: "National_ID_Card.jpg",
          documentUrl: "/documents/doc_002.jpg",
          status: "PENDING",
          submittedAt: "2024-02-15T09:15:00Z",
          priority: "NORMAL",
          category: "IDENTITY"
        },
        {
          id: "3",
          documentId: "doc_003",
          userId: "user_003", 
          userName: "Mike Johnson",
          userEmail: "mike.johnson@email.com",
          documentType: "BUSINESS_REGISTRATION",
          documentName: "CAC_Certificate.pdf",
          documentUrl: "/documents/doc_003.pdf",
          status: "APPROVED",
          submittedAt: "2024-02-14T14:20:00Z",
          reviewedAt: "2024-02-14T16:45:00Z",
          reviewedBy: "admin_001",
          priority: "NORMAL",
          category: "BUSINESS"
        },
        {
          id: "4",
          documentId: "doc_004",
          userId: "user_004",
          userName: "Adaeze Okonkwo",
          userEmail: "adaeze.okonkwo@email.com",
          propertyId: "prop_002",
          propertyTitle: "5-Unit Commercial Building, Lagos",
          documentType: "DEED_OF_ASSIGNMENT",
          documentName: "Deed_of_Assignment.pdf",
          documentUrl: "/documents/doc_004.pdf",
          status: "PENDING",
          submittedAt: "2024-02-15T11:00:00Z",
          priority: "URGENT",
          category: "PROPERTY"
        },
        {
          id: "5",
          documentId: "doc_005",
          userId: "user_005",
          userName: "Gbenga Adebayo",
          userEmail: "gbenga.adebayo@email.com",
          documentType: "CAC",
          documentName: "Business_Registration_Form.pdf",
          documentUrl: "/documents/doc_005.pdf",
          status: "REJECTED",
          submittedAt: "2024-02-13T10:00:00Z",
          reviewedAt: "2024-02-14T11:00:00Z",
          reviewedBy: "admin_002",
          rejectionReason: "Document blurry or illegible",
          priority: "LOW",
          category: "BUSINESS"
        }
      ];
      setVerifications(mockVerifications);
    } catch (error) {
      console.error("Error fetching verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Simulate API call - replace with actual API
      const mockStats: VerificationStats = {
        pending: 23,
        approved: 156,
        rejected: 12,
        totalToday: 15,
        averageReviewTime: 4.5
      };
      setStats(mockStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const filteredVerifications = verifications.filter(verification => {
    const matchesSearch = verification.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           verification.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           verification.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || verification.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || verification.category === categoryFilter;
    const matchesPriority = priorityFilter === "all" || verification.priority === priorityFilter;
    const matchesTab = activeTab === "all" || verification.status.toLowerCase() === activeTab;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case "APPROVED":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      LOW: "outline",
      NORMAL: "secondary",  
      HIGH: "default",
      URGENT: "destructive"
    } as const;
    
    return <Badge variant={variants[priority as keyof typeof variants] || "outline"}>{priority}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "IDENTITY": return <User className="h-4 w-4" />;
      case "PROPERTY": return <Building className="h-4 w-4" />;
      case "BUSINESS": return <FileText className="h-4 w-4" />;
      case "COMPLIANCE": return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Verification</h1>
          <p className="text-muted-foreground">
            Review and verify user-submitted legal documents
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              +12 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Total</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalToday}</div>
            <p className="text-xs text-muted-foreground">
              Documents submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Review Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageReviewTime}h</div>
            <p className="text-xs text-muted-foreground">
              Average processing time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Document Verification Queue</CardTitle>
          <CardDescription>
            Review and approve or reject user-submitted documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">
                Pending ({verifications.filter(v => v.status === "PENDING").length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({verifications.filter(v => v.status === "APPROVED").length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({verifications.filter(v => v.status === "REJECTED").length})
              </TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user name, document name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="IDENTITY">Identity</SelectItem>
                <SelectItem value="PROPERTY">Property</SelectItem>
                <SelectItem value="BUSINESS">Business</SelectItem>
                <SelectItem value="COMPLIANCE">Compliance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documents Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Clock className="h-8 w-8 animate-spin text-primary" />
                        <span className="mt-2 text-sm text-muted-foreground">Loading verifications...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredVerifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No documents match your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVerifications.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={doc.userAvatar} alt={doc.userName} />
                            <AvatarFallback>{doc.userName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold">{doc.userName}</span>
                            <span className="text-xs text-muted-foreground">{doc.userEmail}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <div className="flex flex-col">
                            <span>{doc.documentName}</span>
                            <span className="text-xs text-muted-foreground">{doc.documentType}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(doc.category)}
                          <span className="text-sm">{doc.category}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(doc.priority)}</TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell>{new Date(doc.submittedAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/legal-documents/verification/${doc.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}