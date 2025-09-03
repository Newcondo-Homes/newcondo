'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui'
import { Button } from '@newcondo/ui'
import { Badge } from '@newcondo/ui'
import { Separator } from '@newcondo/ui'
import { Textarea } from '@newcondo/ui'
import { Input } from '@newcondo/ui'
import {
    MapPin,
    User,
    Phone,
    Clock,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Upload,
    Camera,
    MessageSquare,
    Calendar,
    ArrowLeft,
    Navigation,
    FileText
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api'

interface MarkingJobDetail {
    id: string
    propertyId: string
    propertyTitle: string
    propertyAddress: string
    propertyCoordinates?: { lat: number; lng: number }
    contactPersonName: string
    contactPersonPhone: string
    accessInstructions?: string
    urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
    markingFee: number
    paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED'
    status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
    assignedAgentId?: string
    assignedAgentName?: string
    assignedAgentPhone?: string
    requestedBy: string
    requesterName: string
    requesterPhone: string
    preferredTime?: string
    queuePosition?: number
    maxCompletionTime?: string
    completedAt?: string
    completionNotes?: string
    completionImages: string[]
    boundaryData?: any
    timeSlotExpiry?: string
    createdAt: string
    updatedAt: string
}

const mapContainerStyle = {
    width: '100%',
    height: '300px'
}

export default function MarkingJobDetails() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const jobId = params.jobId as string

    const [job, setJob] = useState<MarkingJobDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [completionNotes, setCompletionNotes] = useState('')
    const [uploadingImages, setUploadingImages] = useState(false)

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places']
    })

    useEffect(() => {
        fetchJobDetails()
    }, [jobId])

    const fetchJobDetails = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/marking/jobs/${jobId}`)
            if (response.ok) {
                const data = await response.json()
                setJob(data)
                setCompletionNotes(data.completionNotes || '')
            }
        } catch (error) {
            console.error('Error fetching job details:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateJobStatus = async (newStatus: string, additionalData?: any) => {
        try {
            setUpdating(true)
            const response = await fetch(`/api/marking/jobs/${jobId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                    ...additionalData
                })
            })

            if (response.ok) {
                fetchJobDetails()
            }
        } catch (error) {
            console.error('Error updating job status:', error)
        } finally {
            setUpdating(false)
        }
    }

    const handleStartJob = () => {
        updateJobStatus('IN_PROGRESS')
    }

    const handleCompleteJob = () => {
        updateJobStatus('COMPLETED', { completionNotes })
    }

    const handleCancelJob = () => {
        updateJobStatus('CANCELLED')
    }

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files || files.length === 0) return

        setUploadingImages(true)

        try {
            const formData = new FormData()
            Array.from(files).forEach((file) => {
                formData.append('images', file)
            })

            const response = await fetch(`/api/marking/jobs/${jobId}/images`, {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                fetchJobDetails()
            }
        } catch (error) {
            console.error('Error uploading images:', error)
        } finally {
            setUploadingImages(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'QUEUED': return 'bg-yellow-100 text-yellow-800'
            case 'ASSIGNED': return 'bg-blue-100 text-blue-800'
            case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800'
            case 'COMPLETED': return 'bg-green-100 text-green-800'
            case 'CANCELLED': return 'bg-red-100 text-red-800'
            case 'EXPIRED': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'URGENT': return 'bg-red-100 text-red-800'
            case 'HIGH': return 'bg-orange-100 text-orange-800'
            case 'NORMAL': return 'bg-blue-100 text-blue-800'
            case 'LOW': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const isAssignedAgent = job?.assignedAgentId === user?.id
    const isRequester = job?.requestedBy === user?.id
    const canManageJob = isAssignedAgent || user?.role === 'ADMIN'

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    if (!job) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
                    <p className="text-gray-600">The marking job you're looking for doesn't exist.</p>
                    <Link href="/dashboard/properties/marking">
                        <Button className="mt-4">Back to Dashboard</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Link
                    href="/dashboard/properties/marking"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Marking Job Details
                        </h1>
                        <p className="text-gray-600">Job ID: {job.id}</p>
                    </div>

                    <div className="flex gap-2">
                        <Badge className={getStatusColor(job.status)}>
                            {job.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getUrgencyColor(job.urgencyLevel)}>
                            {job.urgencyLevel}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Property Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Property Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-lg font-semibold mb-2">{job.propertyTitle}</h3>
                            <p className="text-gray-600 mb-4">{job.propertyAddress}</p>

                            {job.propertyCoordinates && isLoaded && (
                                <div className="mb-4">
                                    <GoogleMap
                                        mapContainerStyle={mapContainerStyle}
                                        center={job.propertyCoordinates}
                                        zoom={18}
                                        mapTypeId="satellite"
                                    >
                                        <Marker position={job.propertyCoordinates} />
                                    </GoogleMap>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(
                                        `https://maps.google.com?q=${encodeURIComponent(job.propertyAddress)}`,
                                        '_blank'
                                    )}
                                >
                                    <Navigation className="w-4 h-4 mr-2" />
                                    Open in Google Maps
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium text-sm text-gray-700 mb-1">Contact Person</h4>
                                    <p className="font-medium">{job.contactPersonName}</p>
                                    <p className="text-gray-600 text-sm flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {job.contactPersonPhone}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-sm text-gray-700 mb-1">Property Owner/Requester</h4>
                                    <p className="font-medium">{job.requesterName}</p>
                                    <p className="text-gray-600 text-sm flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {job.requesterPhone}
                                    </p>
                                </div>
                            </div>

                            {job.accessInstructions && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                    <h4 className="font-medium text-sm text-blue-800 mb-2">Access Instructions</h4>
                                    <p className="text-sm text-blue-700">{job.accessInstructions}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Job Progress */}
                    {job.status === 'IN_PROGRESS' || job.status === 'COMPLETED' ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Camera className="w-5 h-5" />
                                    Job Progress & Completion
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {canManageJob && job.status === 'IN_PROGRESS' && (
                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Upload Completion Photos
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    disabled={uploadingImages}
                                                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                                {uploadingImages && (
                                                    <div className="text-sm text-blue-600">Uploading...</div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Completion Notes
                                            </label>
                                            <Textarea
                                                value={completionNotes}
                                                onChange={(e) => setCompletionNotes(e.target.value)}
                                                placeholder="Add notes about the property marking process..."
                                                rows={4}
                                            />
                                        </div>
                                    </div>
                                )}

                                {job.completionImages.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="font-medium text-sm text-gray-700 mb-2">Completion Photos</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {job.completionImages.map((imageUrl, index) => (
                                                <img
                                                    key={index}
                                                    src={imageUrl}
                                                    alt={`Completion photo ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                                                    onClick={() => window.open(imageUrl, '_blank')}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {job.completionNotes && (
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <h4 className="font-medium text-sm text-green-800 mb-2">Completion Notes</h4>
                                        <p className="text-sm text-green-700">{job.completionNotes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : null}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Job Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Job Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Marking Fee</span>
                                <span className="font-semibold text-green-600">
                                    ₦{job.markingFee.toLocaleString()}
                                </span>
                            </div>

                            <Separator />

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Status</span>
                                    <Badge variant={job.paymentStatus === 'SUCCESS' ? 'default' : 'secondary'}>
                                        {job.paymentStatus}
                                    </Badge>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Created</span>
                                    <span>{format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
                                </div>

                                {job.preferredTime && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Preferred Time</span>
                                        <span>{format(new Date(job.preferredTime), 'MMM dd, HH:mm')}</span>
                                    </div>
                                )}

                                {job.maxCompletionTime && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Max Completion</span>
                                        <span>{format(new Date(job.maxCompletionTime), 'MMM dd, yyyy')}</span>
                                    </div>
                                )}

                                {job.completedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Completed At</span>
                                        <span>{format(new Date(job.completedAt), 'MMM dd, yyyy HH:mm')}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Job Actions */}
                    {canManageJob && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {job.status === 'ASSIGNED' && (
                                    <Button onClick={handleStartJob} disabled={updating} className="w-full">
                                        {updating ? 'Starting...' : 'Start Job'}
                                    </Button>
                                )}

                                {job.status === 'IN_PROGRESS' && (
                                    <Button onClick={handleCompleteJob} disabled={updating} className="w-full">
                                        {updating ? 'Completing...' : 'Mark as Completed'}
                                    </Button>
                                )}

                                {job.status !== 'COMPLETED' && job.status !== 'CANCELLED' && (
                                    <Button
                                        onClick={handleCancelJob}
                                        disabled={updating}
                                        variant="destructive"
                                        className="w-full"
                                    >
                                        {updating ? 'Cancelling...' : 'Cancel Job'}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
