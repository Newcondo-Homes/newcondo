# Property Marking Service - Proximity Algorithm

## Overview

The proximity algorithm determines which agents and premium renters are eligible to receive property marking job notifications based on their distance from the property location.

## Algorithm Components

### 1. Haversine Distance Calculation

The service uses the Haversine formula to calculate the great-circle distance between two points on Earth given their latitude and longitude coordinates.

```typescript
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * 
    Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * 
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}
```

## Proximity Thresholds

### Default Radius Settings

| Urgency Level | Default Radius | Max Radius | Expansion Rate |
|--------------|----------------|------------|----------------|
| LOW | 5 km | 25 km | +5 km every 24 hours |
| NORMAL | 10 km | 40 km | +5 km every 12 hours |
| HIGH | 15 km | 60 km | +10 km every 6 hours |
| URGENT | 20 km | 100 km | +15 km every 3 hours |

### Urban vs Rural Adjustments

```typescript
interface LocationType {
  type: 'URBAN' | 'SUBURBAN' | 'RURAL';
  radiusMultiplier: number;
}

const locationAdjustments = {
  URBAN: { radiusMultiplier: 1.0 },    // Standard radius
  SUBURBAN: { radiusMultiplier: 1.5 }, // 50% larger radius
  RURAL: { radiusMultiplier: 2.0 }     // 100% larger radius
};
```

## Agent Eligibility Criteria

### 1. Service Area Matching

Agents must have the property's state/city/LGA in their `agentServiceAreas`:

```typescript
function matchesServiceArea(
  agent: User,
  property: { state: string; city: string }
): boolean {
  return agent.agentServiceAreas.some(area => {
    const [state, city] = area.split(',');
    return state === property.state && 
           (!city || city === property.city);
  });
}
```

### 2. Availability Status

```typescript
function isEligibleAgent(agent: User): boolean {
  return (
    agent.isAvailableForMarking === true &&
    agent.verificationStatus === 'VERIFIED' &&
    (agent.role === 'AGENT' || 
     (agent.role === 'RENTER' && agent.isPremium))
  );
}
```

### 3. Reliability Score Filter

Minimum reliability score requirements:

```typescript
const MIN_RELIABILITY_SCORE = {
  LOW: 3.0,      // Low urgency jobs
  NORMAL: 3.5,   // Normal urgency jobs
  HIGH: 4.0,     // High urgency jobs
  URGENT: 4.5    // Urgent jobs
};
```

## Proximity Search Algorithm

### Step 1: Initial Radius Search

```typescript
async function findNearbyAgents(
  propertyCoordinates: { lat: number; lng: number },
  radius: number,
  urgencyLevel: UrgencyLevel
): Promise<User[]> {
  // Get all available agents/renters
  const candidates = await prisma.user.findMany({
    where: {
      isAvailableForMarking: true,
      verificationStatus: 'VERIFIED',
      OR: [
        { role: 'AGENT' },
        { role: 'RENTER', isPremium: true }
      ],
      agentReliabilityScore: {
        gte: MIN_RELIABILITY_SCORE[urgencyLevel]
      }
    }
  });

  // Filter by distance
  return candidates.filter(candidate => {
    const distance = calculateDistance(
      propertyCoordinates,
      candidate.lastKnownLocation
    );
    return distance <= radius;
  });
}
```

### Step 2: Radius Expansion Strategy

If insufficient agents are found, the radius expands automatically:

```typescript
async function findAgentsWithExpansion(
  propertyCoordinates: Coordinates,
  urgencyLevel: UrgencyLevel
): Promise<User[]> {
  const config = PROXIMITY_CONFIG[urgencyLevel];
  let currentRadius = config.defaultRadius;
  let agents: User[] = [];
  
  while (
    agents.length < MIN_AGENTS_REQUIRED &&
    currentRadius <= config.maxRadius
  ) {
    agents = await findNearbyAgents(
      propertyCoordinates,
      currentRadius,
      urgencyLevel
    );
    
    if (agents.length < MIN_AGENTS_REQUIRED) {
      currentRadius += config.expansionRate;
      
      // Log expansion
      await logRadiusExpansion({
        jobId,
        previousRadius: currentRadius - config.expansionRate,
        newRadius: currentRadius,
        agentsFound: agents.length
      });
    }
  }
  
  return agents;
}
```

### Step 3: Agent Prioritization

Agents within the radius are prioritized by multiple factors:

```typescript
function prioritizeAgents(
  agents: User[],
  propertyLocation: Coordinates
): User[] {
  return agents.sort((a, b) => {
    // 1. Distance (40% weight)
    const distanceA = calculateDistance(propertyLocation, a.location);
    const distanceB = calculateDistance(propertyLocation, b.location);
    const distanceScore = (distanceA - distanceB) * 0.4;
    
    // 2. Reliability score (30% weight)
    const reliabilityScore = 
      (b.agentReliabilityScore - a.agentReliabilityScore) * 0.3;
    
    // 3. Completion rate (20% weight)
    const completionRateA = 
      a.completedMarkingJobs / (a.totalMarkingJobs || 1);
    const completionRateB = 
      b.completedMarkingJobs / (b.totalMarkingJobs || 1);
    const completionScore = (completionRateB - completionRateA) * 0.2;
    
    // 4. Response time (10% weight)
    const responseScore = 
      (a.averageResponseTime - b.averageResponseTime) * 0.1;
    
    return distanceScore + reliabilityScore + 
           completionScore + responseScore;
  });
}
```

## Location Tracking

### Agent Location Updates

Agents can update their location in two ways:

#### 1. Manual Location Update

```typescript
// Agent explicitly sets their service location
PUT /api/agents/location
{
  "latitude": 6.5244,
  "longitude": 3.3792,
  "accuracy": 10 // meters
}
```

#### 2. Background Location Tracking (Mobile App)

Mobile app periodically sends location updates:

```typescript
// Background service updates every 15 minutes when agent is available
POST /api/agents/location/background
{
  "latitude": 6.5244,
  "longitude": 3.3792,
  "timestamp": "2025-10-15T10:30:00Z",
  "accuracy": 5
}
```

### Location Privacy

- Exact locations are never shared with property owners
- Agents only see approximate property location until assigned
- Location data is encrypted at rest
- Retention policy: 30 days for historical location data

## Geographic Boundary Handling

### State/LGA Boundaries

Properties near state or LGA boundaries trigger expanded search:

```typescript
async function handleBoundaryProperty(
  property: Property
): Promise<User[]> {
  // Check if property is within 5km of state/LGA boundary
  const nearBoundary = await checkBoundaryProximity(property);
  
  if (nearBoundary) {
    // Search in adjacent states/LGAs
    const adjacentAreas = await getAdjacentAreas(property);
    const agents = await findAgentsInMultipleAreas([
      property.state,
      ...adjacentAreas
    ]);
    
    return agents;
  }
  
  return findNearbyAgents(property.gpsCoordinates, defaultRadius);
}
```

## Performance Optimization

### 1. Spatial Indexing

Use PostgreSQL PostGIS extension for efficient spatial queries:

```sql
-- Create spatial index
CREATE INDEX idx_user_location_gist 
ON users USING GIST (location);

-- Efficient proximity query
SELECT * FROM users
WHERE ST_DWithin(
  location,
  ST_MakePoint(3.3792, 6.5244)::geography,
  10000 -- 10km in meters
)
AND is_available_for_marking = true;
```

### 2. Caching Strategy

```typescript
// Cache eligible agents by region
const CACHE_KEY = `agents:available:${state}:${city}`;
const CACHE_TTL = 300; // 5 minutes

async function getAvailableAgentsCached(
  state: string,
  city: string
): Promise<User[]> {
  const cached = await redis.get(CACHE_KEY);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const agents = await findAvailableAgents(state, city);
  await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(agents));
  
  return agents;
}
```

### 3. Batch Processing

Process proximity calculations in batches:

```typescript
async function calculateDistancesBatch(
  propertyLocation: Coordinates,
  agents: User[]
): Promise<Array<{ agent: User; distance: number }>> {
  const BATCH_SIZE = 100;
  const results = [];
  
  for (let i = 0; i < agents.length; i += BATCH_SIZE) {
    const batch = agents.slice(i, i + BATCH_SIZE);
    const distances = await Promise.all(
      batch.map(async agent => ({
        agent,
        distance: calculateDistance(propertyLocation, agent.location)
      }))
    );
    results.push(...distances);
  }
  
  return results;
}
```

## Fallback Strategies

### 1. No Agents Found

If no agents are found within max radius:

```typescript
async function handleNoAgentsFound(
  job: PropertyMarkingJob
): Promise<void> {
  // 1. Expand to entire state
  const stateAgents = await findAgentsInState(job.property.state);
  
  if (stateAgents.length > 0) {
    await notifyAgentsStatewide(job, stateAgents);
    return;
  }
  
  // 2. Notify admin for manual assignment
  await notifyAdminNoAgentsAvailable(job);
  
  // 3. Offer alternative to property owner
  await notifyOwnerAlternatives(job, {
    options: [
      'MARK_YOURSELF',
      'SEND_SOMEONE_YOU_KNOW',
      'WAIT_FOR_AGENTS'
    ]
  });
}
```

### 2. Peak Hours Handling

During high-demand periods:

```typescript
async function handlePeakHours(
  job: PropertyMarkingJob
): Promise<void> {
  const isPeakHour = await checkPeakHours();
  
  if (isPeakHour) {
    // Increase radius by 50%
    const adjustedRadius = job.searchRadius * 1.5;
    
    // Relax reliability score requirement
    const adjustedMinScore = MIN_RELIABILITY_SCORE[job.urgencyLevel] - 0.5;
    
    // Increase compensation by 20%
    const adjustedFee = job.markingFee * 1.2;
    
    await updateJobParameters(job.id, {
      searchRadius: adjustedRadius,
      minReliabilityScore: adjustedMinScore,
      markingFee: adjustedFee,
      isPeakHourAdjusted: true
    });
  }
}
```

## Testing & Validation

### Unit Tests

```typescript
describe('Proximity Algorithm', () => {
  test('calculates haversine distance correctly', () => {
    const distance = haversineDistance(
      6.5244, 3.3792, // Lagos
      6.4550, 3.3900  // Nearby location
    );
    expect(distance).toBeCloseTo(7.8, 1); // ~7.8 km
  });
  
  test('finds agents within radius', async () => {
    const agents = await findNearbyAgents(
      { lat: 6.5244, lng: 3.3792 },
      10, // 10km radius
      'NORMAL'
    );
    expect(agents.length).toBeGreaterThan(0);
  });
  
  test('expands radius when insufficient agents', async () => {
    const agents = await findAgentsWithExpansion(
      { lat: 6.5244, lng: 3.3792 },
      'URGENT'
    );
    expect(agents.length).toBeGreaterThanOrEqual(MIN_AGENTS_REQUIRED);
  });
});
```

### Load Testing

Test proximity calculations under load:

```typescript
// Simulate 1000 concurrent proximity searches
async function loadTestProximity() {
  const requests = Array.from({ length: 1000 }, (_, i) => ({
    lat: 6.5244 + (Math.random() - 0.5) * 0.1,
    lng: 3.3792 + (Math.random() - 0.5) * 0.1,
    urgency: ['LOW', 'NORMAL', 'HIGH', 'URGENT'][i % 4]
  }));
  
  const startTime = Date.now();
  
  await Promise.all(
    requests.map(req => 
      findNearbyAgents(req, 10, req.urgency)
    )
  );
  
  const duration = Date.now() - startTime;
  console.log(`Processed 1000 proximity searches in ${duration}ms`);
}
```

## Monitoring & Analytics

### Key Metrics

```typescript
interface ProximityMetrics {
  averageSearchRadius: number;
  radiusExpansionRate: number;
  averageAgentsFound: number;
  noAgentsFoundRate: number;
  averageDistanceToAssignedAgent: number;
  searchLatency: number;
}
```

### Dashboard Queries

```sql
-- Average search radius by urgency level
SELECT 
  urgency_level,
  AVG(search_radius) as avg_radius,
  AVG(agents_found) as avg_agents,
  COUNT(*) as total_searches
FROM proximity_searches
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY urgency_level;

-- Radius expansion frequency
SELECT 
  COUNT(*) as expansions,
  AVG(final_radius - initial_radius) as avg_expansion
FROM proximity_searches
WHERE radius_expanded = true
AND created_at >= NOW() - INTERVAL '7 days';
```

## Configuration Management

### Environment Variables

```bash
# Proximity Algorithm Configuration
PROXIMITY_DEFAULT_RADIUS=10
PROXIMITY_MAX_RADIUS=100
PROXIMITY_EXPANSION_RATE=5
PROXIMITY_MIN_AGENTS=3
PROXIMITY_CACHE_TTL=300

# Location Tracking
LOCATION_UPDATE_INTERVAL=900 # 15 minutes
LOCATION_ACCURACY_THRESHOLD=100 # meters
LOCATION_RETENTION_DAYS=30

# Performance
PROXIMITY_BATCH_SIZE=100
PROXIMITY_QUERY_TIMEOUT=5000 # milliseconds
```

### Runtime Configuration

Adjust proximity settings without redeployment:

```typescript
// Admin endpoint to update proximity config
PUT /api/admin/proximity/config
{
  "urgencyLevel": "HIGH",
  "defaultRadius": 20,
  "maxRadius": 80,
  "expansionRate": 12,
  "minReliabilityScore": 4.2
}
```

## Best Practices

1. **Always validate coordinates** before proximity calculations
2. **Use spatial indexes** for large-scale queries
3. **Cache agent locations** for frequently accessed areas
4. **Monitor expansion rates** to detect coverage issues
5. **Test boundary scenarios** thoroughly
6. **Implement circuit breakers** for external geocoding services
7. **Log all proximity searches** for analytics and debugging
8. **Handle timezone differences** for location timestamps
9. **Respect user privacy** - never expose exact locations
10. **Optimize for mobile networks** - minimize location update frequency

---

**Last Updated:** October 15, 2025  
**Version:** 1.0.0  
**Maintained By:** Newcondo Engineering Team