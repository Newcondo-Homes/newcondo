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



// // backend/marking-service/src/middleware/agentAuth.ts

// import { Request, Response, NextFunction } from 'express';
// import { PrismaClient, Role } from '@prisma/client';

// const prisma = new PrismaClient();

// // Extend Express Request type to include user
// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         id: string;
//         role: Role;
//         email: string;
//         isPremium?: boolean;
//         isAvailableForMarking?: boolean;
//       };
//     }
//   }
// }

// /**
//  * Middleware to verify that the authenticated user is an agent
//  * Assumes authentication middleware has already run and attached user to req
//  */
// export const requireAgent = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     if (!req.user) {
//       res.status(401).json({
//         success: false,
//         message: 'Authentication required',
//       });
//       return;
//     }

//     if (req.user.role !== 'AGENT') {
//       res.status(403).json({
//         success: false,
//         message: 'Access denied. Only agents can perform this action',
//       });
//       return;
//     }

//     next();
//   } catch (error) {
//     console.error('Agent auth error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Authentication error',
//     });
//   }
// };

// /**
//  * Middleware to verify that the user is an agent OR a premium renter
//  * Premium renters can also participate in marking jobs
//  */
// export const requireAgentOrPremiumRenter = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     if (!req.user) {
//       res.status(401).json({
//         success: false,
//         message: 'Authentication required',
//       });
//       return;
//     }

//     const isAgent = req.user.role === 'AGENT';
//     const isPremiumRenter = req.user.role === 'RENTER' && req.user.isPremium;

//     if (!isAgent && !isPremiumRenter) {
//       res.status(403).json({
//         success: false,
//         message: 'Access denied. Only agents and premium renters can perform this action',
//       });
//       return;
//     }

//     next();
//   } catch (error) {
//     console.error('Agent/Premium renter auth error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Authentication error',
//     });
//   }
// };

// /**
//  * Middleware to verify agent is available for marking jobs
//  */
// export const requireAvailableAgent = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     if (!req.user) {
//       res.status(401).json({
//         success: false,
//         message: 'Authentication required',
//       });
//       return;
//     }

//     // Fetch fresh user data to check availability status
//     const user = await prisma.user.findUnique({
//       where: { id: req.user.id },
//       select: {
//         isAvailableForMarking: true,
//         role: true,
//         isPremium: true,
//         agentServiceAreas: true,
//       },
//     });

//     if (!user) {
//       res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//       return;
//     }

//     // Check if user is eligible (agent or premium renter)
//     const isEligible = user.role === 'AGENT' || (user.role === 'RENTER' && user.isPremium);

//     if (!isEligible) {
//       res.status(403).json({
//         success: false,
//         message: 'Only agents and premium renters can mark properties',
//       });
//       return;
//     }

//     // Check if agent/renter is available for marking
//     if (!user.isAvailableForMarking) {
//       res.status(403).json({
//         success: false,
//         message: 'You must set your availability status to accept marking jobs',
//       });
//       return;
//     }

//     // Check if agent has service areas configured
//     if (!user.agentServiceAreas || user.agentServiceAreas.length === 0) {
//       res.status(403).json({
//         success: false,
//         message: 'Please configure your service areas before accepting marking jobs',
//       });
//       return;
//     }

//     next();
//   } catch (error) {
//     console.error('Available agent check error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error checking agent availability',
//     });
//   }
// };

// /**
//  * Middleware to verify agent has completed verification
//  */
// export const requireVerifiedAgent = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     if (!req.user) {
//       res.status(401).json({
//         success: false,
//         message: 'Authentication required',
//       });
//       return;
//     }

//     // Fetch verification status
//     const user = await prisma.user.findUnique({
//       where: { id: req.user.id },
//       select: {
//         verificationStatus: true,
//         role: true,
//       },
//     });

//     if (!user) {
//       res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//       return;
//     }

//     if (user.verificationStatus !== 'VERIFIED') {
//       res.status(403).json({
//         success: false,
//         message: 'Account verification required to accept marking jobs',
//         verificationStatus: user.verificationStatus,
//       });
//       return;
//     }

//     next();
//   } catch (error) {
//     console.error('Verified agent check error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error checking verification status',
//     });
//   }
// };

// /**
//  * Middleware to check if agent has virtual account
//  * Required before they can receive payments for marking jobs
//  */
// export const requireVirtualAccount = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     if (!req.user) {
//       res.status(401).json({
//         success: false,
//         message: 'Authentication required',
//       });
//       return;
//     }

//     // Check if user has a virtual account
//     const virtualAccount = await prisma.virtualAccount.findFirst({
//       where: {
//         userId: req.user.id,
//         isActive: true,
//       },
//     });

//     if (!virtualAccount) {
//       res.status(403).json({
//         success: false,
//         message: 'Virtual account setup required to receive payments for marking jobs',
//         action: 'SETUP_VIRTUAL_ACCOUNT',
//       });
//       return;
//     }

//     next();
//   } catch (error) {
//     console.error('Virtual account check error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error checking virtual account status',
//     });
//   }
// };

// /**
//  * Middleware to verify agent can access a specific marking job
//  * Checks if the agent is assigned to the job or in the queue
//  */
// export const requireJobAccess = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     if (!req.user) {
//       res.status(401).json({
//         success: false,
//         message: 'Authentication required',
//       });
//       return;
//     }

//     const { jobId } = req.params;

//     if (!jobId) {
//       res.status(400).json({
//         success: false,
//         message: 'Job ID is required',
//       });
//       return;
//     }

//     // Check if user is assigned to this job
//     const markingJob = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       select: {
//         assignedAgentId: true,
//         requestedBy: true,
//       },
//     });

//     if (!markingJob) {
//       res.status(404).json({
//         success: false,
//         message: 'Marking job not found',
//       });
//       return;
//     }

//     // Check if user is the assigned agent or the requester
//     const hasAccess = 
//       markingJob.assignedAgentId === req.user.id || 
//       markingJob.requestedBy === req.user.id;

//     if (!hasAccess) {
//       res.status(403).json({
//         success: false,
//         message: 'You do not have access to this marking job',
//       });
//       return;
//     }

//     next();
//   } catch (error) {
//     console.error('Job access check error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error checking job access',
//     });
//   }
// };