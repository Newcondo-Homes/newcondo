import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role, VerificationStatus } from '@newcondo/db';

const prisma = new PrismaClient();

// Extended Request interface to include user data
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: Role;
    email: string;
    verificationStatus: VerificationStatus;
    isAvailableForMarking: boolean;
    agentServiceAreas: string[];
    agentReliabilityScore: number | null;
  };
}

// Verify JWT token and extract user information
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }
    
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    // Fetch user from database to ensure they still exist and get current data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        email: true,
        verificationStatus: true,
        isAvailableForMarking: true,
        agentServiceAreas: true,
        agentReliabilityScore: true
      }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Add user to request object
    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Ensure user is verified
export const requireVerifiedUser = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;
  
  if (user.verificationStatus !== VerificationStatus.VERIFIED) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required to access this service',
      verificationStatus: user.verificationStatus
    });
  }
  
  next();
};

// Ensure user is an agent and available for marking
export const requireAvailableAgent = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;
  
  if (user.role !== Role.AGENT) {
    return res.status(403).json({
      success: false,
      message: 'Agent role required'
    });
  }
  
  if (!user.isAvailableForMarking) {
    return res.status(403).json({
      success: false,
      message: 'Agent must be available for marking jobs'
    });
  }
  
  next();
};

// Check if agent can be assigned to a job (has capacity and serves the area)
export const checkAgentCapacity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { propertyId, agentId } = req.body;
    
    // If assigning to a specific agent, check that agent
    const targetAgentId = agentId || user.id;
    
    const agent = await prisma.user.findUnique({
      where: { id: targetAgentId },
      select: {
        id: true,
        role: true,
        isAvailableForMarking: true,
        agentServiceAreas: true,
        agentReliabilityScore: true,
        assignedMarkingJobs: {
          where: {
            status: {
              in: ['ASSIGNED', 'IN_PROGRESS']
            }
          },
          select: { id: true }
        }
      }
    });
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    if (agent.role !== Role.AGENT || !agent.isAvailableForMarking) {
      return res.status(403).json({
        success: false,
        message: 'Agent not available for marking jobs'
      });
    }
    
    // Check current capacity (max 3 concurrent jobs)
    const currentJobs = agent.assignedMarkingJobs.length;
    if (currentJobs >= 3) {
      return res.status(409).json({
        success: false,
        message: 'Agent has reached maximum concurrent job capacity',
        currentJobs,
        maxCapacity: 3
      });
    }
    
    // Check service area if property is provided
    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { city: true, state: true }
      });
      
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      
      // Check if agent serves this area
      const servesArea = agent.agentServiceAreas.some(area => 
        area.toLowerCase() === property.city.toLowerCase() || 
        area.toLowerCase() === property.state.toLowerCase()
      );
      
      if (!servesArea && agent.agentServiceAreas.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Agent does not serve this area',
          propertyLocation: `${property.city}, ${property.state}`,
          agentServiceAreas: agent.agentServiceAreas
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Agent capacity check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify agent capacity'
    });
  }
};

// Ensure user can access specific marking job
export const validateJobAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { jobId } = req.params;
    
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        requestedBy: true,
        assignedAgentId: true,
        status: true
      }
    });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Marking job not found'
      });
    }
    
    // Check access rights
    const canAccess = (
      user.role === Role.ADMIN || // Admins can access any job
      job.requestedBy === user.id || // Job requester can access
      job.assignedAgentId === user.id // Assigned agent can access
    );
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this marking job'
      });
    }
    
    // Add job to request for use in controller
    (req as any).markingJob = job;
    next();
  } catch (error) {
    console.error('Job access validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate job access'
    });
  }
};

// Ensure job can be modified (not completed, cancelled, or expired)
export const validateJobModifiable = (req: Request, res: Response, next: NextFunction) => {
  const job = (req as any).markingJob;
  
  if (!job) {
    return res.status(500).json({
      success: false,
      message: 'Job data not available'
    });
  }
  
  const nonModifiableStatuses = ['COMPLETED', 'CANCELLED', 'EXPIRED'];
  
  if (nonModifiableStatuses.includes(job.status)) {
    return res.status(409).json({
      success: false,
      message: `Cannot modify job with status: ${job.status}`
    });
  }
  
  next();
};

// Validate agent can complete the job (must be assigned agent)
export const validateJobCompletion = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;
  const job = (req as any).markingJob;
  
  if (!job) {
    return res.status(500).json({
      success: false,
      message: 'Job data not available'
    });
  }
  
  // Only assigned agent or admin can complete job
  if (job.assignedAgentId !== user.id && user.role !== Role.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Only the assigned agent can complete this job'
    });
  }
  
  // Job must be in progress to be completed
  if (job.status !== 'IN_PROGRESS') {
    return res.status(409).json({
      success: false,
      message: `Job cannot be completed as its status is '${job.status}'. It must be 'IN_PROGRESS'.`
    });
  }
  
  next();
};

// Ensure user has an ADMIN role
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;
  
  if (user.role !== Role.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Admin role required to access this resource'
    });
  }
  
  next();
};
