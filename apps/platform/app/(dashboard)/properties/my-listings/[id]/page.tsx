'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, MapPin, Upload, X, Plus, Trash2, Eye } from 'lucide-react';
import { Button } from '@newcondo/ui/components/button';
import { Input } from '@newcondo/ui/components/input';
import { Textarea } from '@newcondo/ui/components/textarea';
import { Label } from '@newcondo/ui/components/label';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui/components/select';
import { Checkbox } from '@newcondo/ui/components/checkbox';
import { Badge } from '@newcondo/ui/components/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui/components/tabs';
import { Separator } from '@newcondo/ui/components/separator';
import { useAuth } from '@/hooks/useAuth';
import { useProperty } from '@/hooks/useProperties';
//TODO: check to use filerouter here
import { useUploadThing } from '@/lib/uploadthing';
import { useUpload } from '@/hooks/useUpload';
import { propertyApi } from '@/lib/api/properties';
import { PropertyType, PropertyStatus, PropertyStructure } from '@newcondo/db';

const propertyFormSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
    price: z.number().optional(),
    currency: z.string().default('NGN'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().default('Nigeria'),
    propertyType: z.nativeEnum(PropertyType),
    structure: z.nativeEnum(PropertyStructure),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    area: z.string().optional(),
    features: z.array(z.string()).default([]),
    totalUnits: z.number().optional(),
    availableUnits: z.number().optional(),
    buildingFeatures: z.array(z.string()).default([]),
    status: z.nativeEnum(PropertyStatus),
    isAvailable: z.boolean().default(true),
});

const unitFormSchema = z.object({
    unitNumber: z.string().min(1, 'Unit number is required'),
    floor: z.number().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    area: z.string().optional(),
    price: z.number().min(1, 'Price is required'),
    features: z.array(z.string()).default([]),
    isAvailable: z.boolean().default(true),
});

type PropertyFormData = z.infer<typeof propertyFormSchema>;
type UnitFormData = z.infer<typeof unitFormSchema>;

interface PropertyImage {
    id: string;
    url: string;
    altText?: string;
    isPrimary: boolean;
    order: number;
}

interface PropertyUnit {
    id: string;
    unitNumber: string;
    floor?: number;
    bedrooms?: number;
    bathrooms?: number;
    area?: string;
    price: number;
    features: string[];
    isAvailable: boolean;
    images: Array<{
        id: string;
        url: string;
        isPrimary: boolean;
    }>;
}

const commonFeatures = [
    'Parking', 'Generator', 'Security', 'Water Supply', 'Electricity',
    'Internet', 'Air Conditioning', 'Furnished', 'Swimming Pool', 'Gym',
    'Elevator', 'Balcony', 'Garden', 'Garage', 'Storage'
];

const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
    'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
    'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
    'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export default function EditListingPage() {
    const router = useRouter();
    const params = useParams();
    const propertyId = params.id as string;
    const { user } = useAuth();
    const { data: propertyData, isLoading: propertyLoading } = useProperty(propertyId);;
    const { startUpload, isUploading } = useUploadThing('propertyImages');

    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);
    const [images, setImages] = useState<PropertyImage[]>([]);
    const [units, setUnits] = useState<PropertyUnit[]>([]);
    const [showAddUnit, setShowAddUnit] = useState(false);
    const [editingUnit, setEditingUnit] = useState<PropertyUnit | null>(null);

    const form = useForm<PropertyFormData>({
        resolver: zodResolver(propertyFormSchema),
        defaultValues: {
            currency: 'NGN',
            country: 'Nigeria',
            features: [],
            buildingFeatures: [],
            status: PropertyStatus.DRAFT,
            structure: PropertyStructure.SINGLE_UNIT,
            isAvailable: true,
        }
    });

    const unitForm = useForm<UnitFormData>({
        resolver: zodResolver(unitFormSchema),
        defaultValues: {
            features: [],
            isAvailable: true,
        }
    });

    const watchStructure = form.watch('structure');

    useEffect(() => {
        if (!propertyData) return;

        // Redirect if user doesn't own this property
        if (propertyData.ownerId !== user?.id) {
            router.push('/dashboard/properties/my-listings');
            return;
        }

        form.reset({
            title: propertyData.title,
            description: propertyData.description,
            price: propertyData.price ? Number(propertyData.price) : undefined,
            currency: propertyData.currency,
            address: propertyData.address,
            city: propertyData.city,
            state: propertyData.state,
            country: propertyData.country,
            propertyType: propertyData.propertyType,
            structure: propertyData.structure,
            bedrooms: propertyData.bedrooms ?? undefined,
            bathrooms: propertyData.bathrooms ?? undefined,
            area: propertyData.area ?? undefined,
            features: propertyData.features ?? [],
            totalUnits: propertyData.totalUnits ?? undefined,
            availableUnits: propertyData.availableUnits ?? undefined,
            buildingFeatures: propertyData.buildingFeatures ?? [],
            status: propertyData.status,
            isAvailable: propertyData.isAvailable,
        });

        setImages((propertyData.images ?? []).map((img, i) => ({
            id: img.id,
            url: img.url,
            altText: img.altText ?? undefined,
            isPrimary: img.isPrimary,
            order: img.order ?? i,
        })));

        setUnits(
            ((propertyData as any).units ?? []).map((u: PropertyUnit) => u)
        );
    }, [propertyData, user?.id]);




    const handleImageUpload = async (files: FileList) => {
        const fileArray = Array.from(files);
        const uploaded = await startUpload(fileArray);
        if (!uploaded) return;

        const newImages: PropertyImage[] = uploaded.map(
            (file: { url: string; name: string }, index: number) => ({
                id: `new-${Date.now()}-${index}`,
                url: file.url,
                altText: file.name,
                isPrimary: images.length === 0 && index === 0,
                order: images.length + index,
            })
        );
        setImages((prev) => [...prev, ...newImages]);
    };

    const handleImageDelete = (imageId: string) => {
        setImages(images.filter(img => img.id !== imageId));
    };

    const handleSetPrimary = (imageId: string) => {
        setImages(images.map(img => ({
            ...img,
            isPrimary: img.id === imageId
        })));
    };

    const handleAddUnit = (data: UnitFormData) => {
        const newUnit: PropertyUnit = { id: `new-${Date.now()}`, ...data, images: [] };
        setUnits((prev) => [...prev, newUnit]);
        setShowAddUnit(false);
        unitForm.reset();
    };

    const handleEditUnit = (unit: PropertyUnit) => {
        setEditingUnit(unit);
        unitForm.reset(unit);
    };

    const handleUpdateUnit = (data: UnitFormData) => {
        if (!editingUnit) return;
        setUnits((prev) =>
            prev.map((u) => (u.id === editingUnit.id ? { ...u, ...data } : u))
        );
        setEditingUnit(null);
        unitForm.reset();
    };

    const handleDeleteUnit = (unitId: string) => {
        if (confirm('Are you sure you want to delete this unit?')) {
            setUnits((prev) => prev.filter((u) => u.id !== unitId));
        }
    };

    const onSubmit = async (data: PropertyFormData) => {
        try {
            setSaving(true);
            await propertyApi.update({
                id: propertyId,
                ...data,
            });
            router.push('/dashboard/properties/my-listings');
        } catch (error) {
            console.error('Failed to update property:', error);
        } finally {
            setSaving(false);
        }
    };

    if (propertyLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" disabled>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Listings
                    </Button>
                </div>
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="h-64 bg-gray-200 rounded"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard/properties/my-listings')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Listings
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
                        <p className="text-sm text-gray-600">{property?.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {property?.boundaryVerified ? (
                        <Badge className="bg-green-100 text-green-800">Boundary Verified</Badge>
                    ) : (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            Boundary Pending
                        </Badge>
                    )}
                    <Button
                        onClick={() => router.push(`/dashboard/properties/${propertyId}`)}
                        variant="outline"
                        size="sm"
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                    </Button>
                </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="basic">Basic Details</TabsTrigger>
                        <TabsTrigger value="images">Images</TabsTrigger>
                        <TabsTrigger value="units" disabled={watchStructure !== 'MULTI_FAMILY'}>
                            Units ({units.length})
                        </TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Property Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Property Title</Label>
                                        <Input
                                            id="title"
                                            {...form.register('title')}
                                            placeholder="e.g., Modern 3-bedroom apartment in Victoria Island"
                                        />
                                        {form.formState.errors.title && (
                                            <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="propertyType">Property Type</Label>
                                        <Controller
                                            name="propertyType"
                                            control={form.control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select property type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.values(PropertyType).map(type => (
                                                            <SelectItem key={type} value={type}>
                                                                {type.replace('_', ' ')}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="structure">Property Structure</Label>
                                        <Controller
                                            name="structure"
                                            control={form.control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select structure type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="SINGLE_UNIT">Single Unit</SelectItem>
                                                        <SelectItem value="MULTI_FAMILY">Multi-Family Building</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>

                                    {watchStructure === 'SINGLE_UNIT' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="price">Monthly Rent (₦)</Label>
                                            <Input
                                                id="price"
                                                type="number"
                                                {...form.register('price', { valueAsNumber: true })}
                                                placeholder="e.g., 500000"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        {...form.register('description')}
                                        placeholder="Describe your property..."
                                        rows={4}
                                    />
                                    {form.formState.errors.description && (
                                        <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Location</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="address">Street Address</Label>
                                    <Input
                                        id="address"
                                        {...form.register('address')}
                                        placeholder="e.g., 123 Lagos Street"
                                    />
                                    {form.formState.errors.address && (
                                        <p className="text-sm text-red-600">{form.formState.errors.address.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            {...form.register('city')}
                                            placeholder="e.g., Lagos"
                                        />
                                        {form.formState.errors.city && (
                                            <p className="text-sm text-red-600">{form.formState.errors.city.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="state">State</Label>
                                        <Controller
                                            name="state"
                                            control={form.control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select state" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {nigerianStates.map(state => (
                                                            <SelectItem key={state} value={state}>
                                                                {state}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="country">Country</Label>
                                        <Input
                                            id="country"
                                            {...form.register('country')}
                                            disabled
                                            value="Nigeria"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {watchStructure === 'SINGLE_UNIT' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Property Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="bedrooms">Bedrooms</Label>
                                            <Input
                                                id="bedrooms"
                                                type="number"
                                                {...form.register('bedrooms', { valueAsNumber: true })}
                                                placeholder="e.g., 3"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="bathrooms">Bathrooms</Label>
                                            <Input
                                                id="bathrooms"
                                                type="number"
                                                {...form.register('bathrooms', { valueAsNumber: true })}
                                                placeholder="e.g., 2"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="area">Area</Label>
                                            <Input
                                                id="area"
                                                {...form.register('area')}
                                                placeholder="e.g., 120 sqm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Property Features</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {commonFeatures.map(feature => (
                                                <div key={feature} className="flex items-center space-x-2">
                                                    <Controller
                                                        name="features"
                                                        control={form.control}
                                                        render={({ field }) => (
                                                            <Checkbox
                                                                checked={field.value.includes(feature)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        field.onChange([...field.value, feature]);
                                                                    } else {
                                                                        field.onChange(field.value.filter(f => f !== feature));
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                    <Label className="text-sm">{feature}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {watchStructure === 'MULTI_FAMILY' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Building Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="totalUnits">Total Units</Label>
                                            <Input
                                                id="totalUnits"
                                                type="number"
                                                {...form.register('totalUnits', { valueAsNumber: true })}
                                                placeholder="e.g., 20"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="availableUnits">Available Units</Label>
                                            <Input
                                                id="availableUnits"
                                                type="number"
                                                {...form.register('availableUnits', { valueAsNumber: true })}
                                                placeholder="e.g., 5"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Building Features</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {commonFeatures.map(feature => (
                                                <div key={feature} className="flex items-center space-x-2">
                                                    <Controller
                                                        name="buildingFeatures"
                                                        control={form.control}
                                                        render={({ field }) => (
                                                            <Checkbox
                                                                checked={field.value.includes(feature)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        field.onChange([...field.value, feature]);
                                                                    } else {
                                                                        field.onChange(field.value.filter(f => f !== feature));
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                    <Label className="text-sm">{feature}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="images" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Property Images</CardTitle>
                                <p className="text-sm text-gray-600">
                                    Upload high-quality images of your property. The first image will be used as the primary image.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-lg font-medium text-gray-900 mb-2">Upload Images</p>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Drag and drop images here, or click to select files
                                        </p>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <label htmlFor="image-upload">
                                            <Button type="button" variant="outline" disabled={isUploading}>
                                                {isUploading ? 'Uploading...' : 'Select Images'}
                                            </Button>
                                        </label>
                                    </div>

                                    {images.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {images.map((image, index) => (
                                                <div key={image.id} className="relative group">
                                                    <img
                                                        src={image.url}
                                                        alt={image.altText || `Property image ${index + 1}`}
                                                        className="w-full h-32 object-cover rounded-lg"
                                                    />
                                                    {image.isPrimary && (
                                                        <Badge className="absolute top-2 left-2 bg-green-600 text-white">
                                                            Primary
                                                        </Badge>
                                                    )}
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleImageDelete(image.id)}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    {!image.isPrimary && (
                                                        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleSetPrimary(image.id)}
                                                                className="h-6 text-xs px-2"
                                                            >
                                                                Set Primary
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="units" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Property Units</CardTitle>
                                    <p className="text-sm text-gray-600">
                                        Manage individual units within this multi-family building.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => setShowAddUnit(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Unit
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {units.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-600">No units added yet.</p>
                                        <Button
                                            type="button"
                                            onClick={() => setShowAddUnit(true)}
                                            className="mt-4"
                                        >
                                            Add Your First Unit
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {units.map((unit) => (
                                            <div key={unit.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-medium">Unit {unit.unitNumber}</h4>
                                                        <p className="text-sm text-gray-600">
                                                            {unit.bedrooms} bed, {unit.bathrooms} bath • ₦{unit.price.toLocaleString()}/month
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={unit.isAvailable ? "outline" : "secondary"}>
                                                            {unit.isAvailable ? 'Available' : 'Occupied'}
                                                        </Badge>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditUnit(unit)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleDeleteUnit(unit.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                {unit.features.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {unit.features.map(feature => (
                                                            <Badge key={feature} variant="secondary" className="text-xs">
                                                                {feature}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Add/Edit Unit Modal */}
                        {(showAddUnit || editingUnit) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {editingUnit ? 'Edit Unit' : 'Add New Unit'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <form
                                        onSubmit={unitForm.handleSubmit(editingUnit ? handleUpdateUnit : handleAddUnit)}
                                        className="space-y-4"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="unitNumber">Unit Number</Label>
                                                <Input
                                                    id="unitNumber"
                                                    {...unitForm.register('unitNumber')}
                                                    placeholder="e.g., A1, Flat 2, Unit 101"
                                                />
                        // ... (all your existing code above remains unchanged)

                                                {unitForm.formState.errors.unitNumber && (
                                                    <p className="text-sm text-red-600">{unitForm.formState.errors.unitNumber.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="floor">Floor</Label>
                                                <Input
                                                    id="floor"
                                                    type="number"
                                                    {...unitForm.register('floor', { valueAsNumber: true })}
                                                    placeholder="e.g., 1"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="bedrooms">Bedrooms</Label>
                                                <Input
                                                    id="bedrooms"
                                                    type="number"
                                                    {...unitForm.register('bedrooms', { valueAsNumber: true })}
                                                    placeholder="e.g., 2"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="bathrooms">Bathrooms</Label>
                                                <Input
                                                    id="bathrooms"
                                                    type="number"
                                                    {...unitForm.register('bathrooms', { valueAsNumber: true })}
                                                    placeholder="e.g., 1"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="area">Area</Label>
                                                <Input
                                                    id="area"
                                                    {...unitForm.register('area')}
                                                    placeholder="e.g., 75 sqm"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="price">Price (₦)</Label>
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    {...unitForm.register('price', { valueAsNumber: true })}
                                                    placeholder="e.g., 300000"
                                                />
                                                {unitForm.formState.errors.price && (
                                                    <p className="text-sm text-red-600">{unitForm.formState.errors.price.message}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Unit Features</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {commonFeatures.map(feature => (
                                                    <div key={feature} className="flex items-center space-x-2">
                                                        <Controller
                                                            name="features"
                                                            control={unitForm.control}
                                                            render={({ field }) => (
                                                                <Checkbox
                                                                    checked={field.value.includes(feature)}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            field.onChange([...field.value, feature]);
                                                                        } else {
                                                                            field.onChange(field.value.filter(f => f !== feature));
                                                                        }
                                                                    }}
                                                                />
                                                            )}
                                                        />
                                                        <Label className="text-sm">{feature}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Controller
                                                name="isAvailable"
                                                control={unitForm.control}
                                                render={({ field }) => (
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                )}
                                            />
                                            <Label>Available</Label>
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setShowAddUnit(false);
                                                    setEditingUnit(null);
                                                    unitForm.reset();
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit">
                                                {editingUnit ? 'Update Unit' : 'Add Unit'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Property Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Controller
                                        name="isAvailable"
                                        control={form.control}
                                        render={({ field }) => (
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        )}
                                    />
                                    <Label>Mark property as available</Label>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Controller
                                        name="status"
                                        control={form.control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.values(PropertyStatus).map(status => (
                                                        <SelectItem key={status} value={status}>
                                                            {status}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Separator />

                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/dashboard/properties/my-listings')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : (
                            <>
                                <Save className="h-4 w-4 mr-2" /> Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
