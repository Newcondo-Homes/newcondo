'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  FileSignature, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Download,
  Eye,
  MoreHorizontal,
  Shield
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDigitalSignatures } from '@/hooks/useDigitalSignatures'
import { DigitalSignatureVerifier } from '@/components/legal-documents/DigitalSignatureVerifier'
import { DocumentStatusBadge } from '@/components/legal-documents/DocumentStatusBadge'

export default function DigitalSignaturesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const { signatures, isLoading, verifySignature, downloadSignedDocument } = useDigitalSignatures()

  const filteredSignatures = signatures?.filter(signature => {
    const matchesSearch = signature.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signature.signerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || signature.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Digital Signatures</h1>
          <p className="text-muted-foreground">
            Manage and verify digital signatures for legal documents
          </p>
        </div>
        <Button>
          <FileSignature className="mr-2 h-4 w-4" />
          Create Signature Request
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signatures</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">2,241</div>
            <p className="text-xs text-muted-foreground">
              78.7% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">521</div>
            <p className="text-xs text-muted-foreground">
              Awaiting signatures
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">85</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Signatures</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="signed">Signed</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search signatures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[300px]"
              />
            </div>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Digital Signature Records</CardTitle>
              <CardDescription>
                All digital signature requests and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Signer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Signed Date</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSignatures?.map((signature) => (
                    <TableRow key={signature.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <FileSignature className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{signature.documentName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{signature.signerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {signature.signerEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(signature.status)}
                          <DocumentStatusBadge status={signature.status} />
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(signature.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {signature.signedAt ? 
                          new Date(signature.signedAt).toLocaleDateString() : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        {signature.expiresAt ? 
                          new Date(signature.expiresAt).toLocaleDateString() : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {signature.status === 'signed' && (
                              <DropdownMenuItem
                                onClick={() => downloadSignedDocument(signature.id)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download Signed
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => verifySignature(signature.id)}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Verify Signature
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Void Signature
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tab contents would be similar with filtered data */}
      </Tabs>

      {/* Digital Signature Verifier Component */}
      <DigitalSignatureVerifier />
    </div>
  )
}