import { useQuery } from '@tanstack/react-query';
import {
  getMarketOverview,
  getPropertyTrends,
  getPricingAnalysis,
  getDemandAnalysis,
  getLocationInsights,
  getSeasonalTrends,
  getCompetitiveAnalysis,
  getForecastData,
} from '@/lib/api/marketInsights';
import type { DateRange, MarketFilters } from '@/types/market';

export function useMarketInsights(dateRange?: DateRange, filters?: MarketFilters) {
  // Market overview
  const overviewQuery = useQuery({
    queryKey: ['market', 'overview', dateRange, filters],
    queryFn: () => getMarketOverview(dateRange, filters),
  });

  // Property trends
  const trendsQuery = useQuery({
    queryKey: ['market', 'trends', dateRange, filters],
    queryFn: () => getPropertyTrends(dateRange, filters),
  });

  // Pricing analysis
  const pricingQuery = useQuery({
    queryKey: ['market', 'pricing', dateRange, filters],
    queryFn: () => getPricingAnalysis(dateRange, filters),
  });

  // Demand analysis
  const demandQuery = useQuery({
    queryKey: ['market', 'demand', dateRange, filters],
    queryFn: () => getDemandAnalysis(dateRange, filters),
  });

  return {
    overview: overviewQuery.data,
    trends: trendsQuery.data,
    pricing: pricingQuery.data,
    demand: demandQuery.data,
    isLoading:
      overviewQuery.isLoading ||
      trendsQuery.isLoading ||
      pricingQuery.isLoading ||
      demandQuery.isLoading,
    isError: overviewQuery.isError || trendsQuery.isError || pricingQuery.isError || demandQuery.isError,
    refetch: () => {
      overviewQuery.refetch();
      trendsQuery.refetch();
      pricingQuery.refetch();
      demandQuery.refetch();
    },
  };
}

export function useLocationInsights(location?: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['market', 'location', location, dateRange],
    queryFn: () => getLocationInsights(location, dateRange),
    enabled: !!location,
  });
}

export function useSeasonalTrends(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['market', 'seasonal', dateRange],
    queryFn: () => getSeasonalTrends(dateRange),
  });
}

export function useCompetitiveAnalysis(filters?: MarketFilters) {
  return useQuery({
    queryKey: ['market', 'competitive', filters],
    queryFn: () => getCompetitiveAnalysis(filters),
  });
}

export function useMarketForecasts(months: number = 6) {
  return useQuery({
    queryKey: ['market', 'forecasts', months],
    queryFn: () => getForecastData(months),
    staleTime: 3600000, // 1 hour
  });
}

// Property type performance comparison
export function usePropertyTypeComparison(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['market', 'property-type-comparison', dateRange],
    queryFn: async () => {
      const data = await getPropertyTrends(dateRange);
      
      return data.byPropertyType?.map((type: any) => ({
        type: type.propertyType,
        totalListings: type.count,
        averagePrice: type.averagePrice,
        occupancyRate: type.occupancyRate,
        averageDaysToRent: type.averageDaysToRent,
        priceGrowth: type.priceGrowth,
      }));
    },
  });
}

// Location heat map data
export function useLocationHeatMap(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['market', 'location-heatmap', dateRange],
    queryFn: async () => {
      const data = await getLocationInsights(undefined, dateRange);
      
      return data.locations?.map((loc: any) => ({
        state: loc.state,
        city: loc.city,
        propertyCount: loc.count,
        averagePrice: loc.averagePrice,
        demandScore: loc.demandScore,
        coordinates: loc.coordinates,
      }));
    },
  });
}

// Price range distribution
export function usePriceDistribution(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['market', 'price-distribution', dateRange],
    queryFn: async () => {
      const data = await getPricingAnalysis(dateRange);
      
      return data.distribution;
    },
  });
}

// Market growth indicators
export function useMarketGrowthIndicators(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['market', 'growth-indicators', dateRange],
    queryFn: async () => {
      const [overview, trends] = await Promise.all([
        getMarketOverview(dateRange),
        getPropertyTrends(dateRange),
      ]);

      return {
        listingsGrowth: overview.listingsGrowth,
        priceGrowth: overview.priceGrowth,
        rentalsGrowth: overview.rentalsGrowth,
        marketHealthScore: overview.healthScore,
        trendDirection: trends.direction,
        growthRate: trends.growthRate,
      };
    },
  });
}