'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Eye, Trash2, MapPin, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useProperties } from '@/hooks/useProperties';
import { PropertyStatus, PropertyStructure } from '@newcondo/db';

interface Property {
  id: string;
  title: string;
  description: string;
  price?: number;
  currency: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  status: PropertyStatus;
  structure: PropertyStructure;
  totalUnits?: number;
  availableUnits?: number;
  isAvailable: boolean;
  boundaryVerified: boolean;
  images: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
  }>;
  units?: Array<{
    id: string;
    unitNumber: string;
    price: number;
    bedrooms?: number;
    bathrooms?: number;
    isAvailable: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  RENTED: 'bg-blue-100 text-blue-800',
  UNAVAILABLE: 'bg-red-100 text-red-800',
};

export default function MyListingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { properties, loading, deleteProperty } = useProperties();
  const [selectedTab, setSelectedTab] = useState('all');

  const userProperties = properties?.filter(p => p.ownerId === user?.id) || [];

  const filteredProperties = userProperties.filter(property => {
    switch (selectedTab) {
      case 'published':
        return property.status === 'PUBLISHED';
      case 'draft':
        return property.status === 'DRAFT';
      case 'pending':
        return property.status === 'PENDING';
      case 'rented':
        return property.status === 'RENTED';
      default:
        return true;
    }
  });

  const handleEdit = (propertyId: string) => {
    router.push(`/dashboard/properties/my-listings/${propertyId}`);
  };

  const handleView = (propertyId: string) => {
    router.push(`/dashboard/properties/${propertyId}`);
  };

  const handleDelete = async (propertyId: string) => {
    if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      try {
        await deleteProperty(propertyId);
      } catch (error) {
        console.error('Failed to delete property:', error);
      }
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPrimaryImage = (images: Property['images']) => {
    const primary = images.find(img => img.isPrimary);
    return primary?.url || images[0]?.url || '/images/placeholders/property.jpg';
  };

  const getPropertySummary = (property: Property) => {
    if (property.structure === 'MULTI_FAMILY') {
      return `${property.totalUnits} units • ${property.availableUnits} available`;
    }
    return `${property.bedrooms || 0} bed • ${property.bathrooms || 0} bath`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-600 mt-1">Manage your property listings</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-600 mt-1">
            {userProperties.length} {userProperties.length === 1 ? 'property' : 'properties'} listed
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/properties/create')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Property
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({userProperties.length})</TabsTrigger>
          <TabsTrigger value="published">
            Published ({userProperties.filter(p => p.status === 'PUBLISHED').length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({userProperties.filter(p => p.status === 'DRAFT').length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({userProperties.filter(p => p.status === 'PENDING').length})
          </TabsTrigger>
          <TabsTrigger value="rented">
            Rented ({userProperties.filter(p => p.status === 'RENTED').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {filteredProperties.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedTab === 'all' ? 'No properties listed yet' : `No ${selectedTab} properties`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedTab === 'all' 
                    ? 'Start by creating your first property listing'
                    : `You don't have any ${selectedTab} properties at the moment`
                  }
                </p>
                {selectedTab === 'all' && (
                  <Button onClick={() => router.push('/dashboard/properties/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Listing
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={getPrimaryImage(property.images)}
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className={statusColors[property.status]}>
                        {property.status}
                      </Badge>
                      {!property.boundaryVerified && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          Boundary Pending
                        </Badge>
                      )}
                    </div>
                    {property.structure === 'MULTI_FAMILY' && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary">Multi-Family</Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{property.title}</CardTitle>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.city}, {property.state}
                    </div>
                  </CardHeader>

                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {property.description}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          {getPropertySummary(property)}
                        </div>
                        {property.area && (
                          <div className="text-sm text-gray-600">
                            {property.area}
                          </div>
                        )}
                      </div>

                      {property.structure === 'SINGLE_UNIT' ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-green-600">
                            {property.price ? formatPrice(property.price, property.currency) : 'Price TBD'}
                          </span>
                          {property.price && (
                            <span className="text-sm text-gray-500">per month</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          {property.units && property.units.length > 0 && (
                            <span>
                              From {formatPrice(
                                Math.min(...property.units.map(u => u.price)), 
                                property.currency
                              )} per month
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 border-t">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Updated {new Date(property.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(property.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(property.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(property.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}