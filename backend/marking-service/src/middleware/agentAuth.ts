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






// import { Request, Response, NextFunction } from 'express';
// import { ApiResponse } from '../../../shared/src/utils/response';
// import { verifyJWT } from '../../../shared/src/utils/jwt';
// import prisma from '@newcondo/db';

// interface AuthenticatedAgent extends Express.Request {
//   user?: {
//     id: string;
//     role: string;
//     email: string;
//     isAvailableForMarking: boolean;
//     agentServiceAreas: string[];
//     agentReliabilityScore: number;
//     totalMarkingJobs: number;
//     completedMarkingJobs: number;
//   };
// }

// /**
//  * Middleware to authenticate agent/marker requests
//  * Verifies JWT token and ensures user has marking permissions
//  */
// export const authenticateAgent = async (
//   req: AuthenticatedAgent,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json(
//         ApiResponse.error('Missing or invalid authorization token')
//       );
//     }

//     const token = authHeader.substring(7);

//     const decoded = verifyJWT(token);
//     if (!decoded) {
//       return res.status(401).json(
//         ApiResponse.error('Invalid or expired token')
//       );
//     }

//     // Fetch user from database to get latest data
//     const user = await prisma.user.findUnique({
//       where: { id: decoded.sub || decoded.userId },
//       select: {
//         id: true,
//         role: true,
//         email: true,
//         isAvailableForMarking: true,
//         agentServiceAreas: true,
//         agentReliabilityScore: true,
//         totalMarkingJobs: true,
//         completedMarkingJobs: true,
//       },
//     });

//     if (!user) {
//       return res.status(401).json(
//         ApiResponse.error('User not found')
//       );
//     }

//     // Verify user is agent or has marking capability
//     if (user.role !== 'AGENT' && user.role !== 'RENTER') {
//       return res.status(403).json(
//         ApiResponse.error('Only agents and premium renters can perform marking operations')
//       );
//     }

//     req.user = user as any;
//     next();
//   } catch (error) {
//     return res.status(401).json(
//       ApiResponse.error('Authentication failed', error instanceof Error ? error.message : undefined)
//     );
//   }
// };

// /**
//  * Middleware to verify agent is available and qualified for jobs
//  */
// export const verifyAgentAvailability = (
//   req: AuthenticatedAgent,
//   res: Response,
//   next: NextFunction
// ) => {
//   const agent = req.user;

//   if (!agent) {
//     return res.status(401).json(
//       ApiResponse.error('Agent not authenticated')
//     );
//   }

//   if (!agent.isAvailableForMarking) {
//     return res.status(403).json(
//       ApiResponse.error('Agent is currently not available for marking jobs', {
//         reason: 'Agent availability is disabled in profile settings',
//       })
//     );
//   }

//   if (!agent.agentServiceAreas || agent.agentServiceAreas.length === 0) {
//     return res.status(403).json(
//       ApiResponse.error('Agent has not configured service areas', {
//         requiredAction: 'Agent must set service areas before accepting marking jobs',
//       })
//     );
//   }

//   next();
// };

// /**
//  * Middleware to verify agent reliability score is acceptable
//  * Agents with low reliability scores may be restricted from certain operations
//  */
// export const verifyAgentReliability = (minScoreRequired: number = 2.0) => {
//   return (req: AuthenticatedAgent, res: Response, next: NextFunction) => {
//     const agent = req.user;

//     if (!agent) {
//       return res.status(401).json(
//         ApiResponse.error('Agent not authenticated')
//       );
//     }

//     const reliabilityScore = agent.agentReliabilityScore || 0;

//     if (reliabilityScore < minScoreRequired) {
//       return res.status(403).json(
//         ApiResponse.error('Agent reliability score is below minimum required', {
//           currentScore: reliabilityScore,
//           minimumRequired: minScoreRequired,
//           completionRate: `${((agent.completedMarkingJobs / agent.totalMarkingJobs) * 100).toFixed(2)}%`,
//           requiredAction: 'Complete more marking jobs successfully to improve reliability score',
//         })
//       );
//     }

//     next();
//   };
// };

// /**
//  * Middleware to check if agent is owner of a specific marking job
//  */
// export const verifyAgentOwnsMarkingJob = async (
//   req: AuthenticatedAgent,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const agent = req.user;
//     const { markingJobId } = req.params;

//     if (!agent) {
//       return res.status(401).json(
//         ApiResponse.error('Agent not authenticated')
//       );
//     }

//     if (!markingJobId) {
//       return res.status(400).json(
//         ApiResponse.error('Marking job ID is required')
//       );
//     }

//     const markingJob = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//       select: { assignedAgentId: true },
//     });

//     if (!markingJob) {
//       return res.status(404).json(
//         ApiResponse.error('Marking job not found')
//       );
//     }

//     if (markingJob.assignedAgentId !== agent.id) {
//       return res.status(403).json(
//         ApiResponse.error('Agent does not have permission to modify this marking job')
//       );
//     }

//     next();
//   } catch (error) {
//     return res.status(500).json(
//       ApiResponse.error('Failed to verify marking job ownership', error instanceof Error ? error.message : undefined)
//     );
//   }
// };

// /**
//  * Middleware to prevent agent from accepting too many concurrent jobs
//  * Limits to prevent burnout and ensure quality
//  */
// export const checkAgentConcurrentJobs = (maxConcurrentJobs: number = 3) => {
//   return async (req: AuthenticatedAgent, res: Response, next: NextFunction) => {
//     try {
//       const agent = req.user;

//       if (!agent) {
//         return res.status(401).json(
//           ApiResponse.error('Agent not authenticated')
//         );
//       }

//       const activeJobs = await prisma.propertyMarkingJob.count({
//         where: {
//           assignedAgentId: agent.id,
//           status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
//         },
//       });

//       if (activeJobs >= maxConcurrentJobs) {
//         return res.status(429).json(
//           ApiResponse.error('Agent has reached maximum concurrent marking jobs', {
//             currentActiveJobs: activeJobs,
//             maxAllowed: maxConcurrentJobs,
//             message: 'Complete or cancel current jobs before accepting new ones',
//           })
//         );
//       }

//       next();
//     } catch (error) {
//       return res.status(500).json(
//         ApiResponse.error('Failed to check agent concurrent jobs', error instanceof Error ? error.message : undefined)
//       );
//     }
//   };
// };

// /**
//  * Middleware to validate agent location is within service areas
//  */
// export const validateAgentInServiceArea = (
//   req: AuthenticatedAgent,
//   res: Response,
//   next: NextFunction
// ) => {
//   const agent = req.user;
//   const { propertyCity, propertyState } = req.body;

//   if (!agent) {
//     return res.status(401).json(
//       ApiResponse.error('Agent not authenticated')
//     );
//   }

//   if (!propertyCity || !propertyState) {
//     return res.status(400).json(
//       ApiResponse.error('Property location (city, state) is required')
//     );
//   }

//   const serviceAreas = agent.agentServiceAreas || [];
//   const propertyArea = `${propertyCity}, ${propertyState}`;

//   const isInServiceArea = serviceAreas.some(
//     (area) => area.toLowerCase() === propertyArea.toLowerCase() ||
//               area.toLowerCase().includes(propertyCity.toLowerCase())
//   );

//   if (!isInServiceArea) {
//     return res.status(403).json(
//       ApiResponse.error('Property location is outside agent service areas', {
//         propertyLocation: propertyArea,
//         agentServiceAreas: serviceAreas,
//         message: 'Agent can only accept jobs within configured service areas',
//       })
//     );
//   }

//   next();
// };











// // backend/marking-service/src/middleware/agentAuth.ts

// import { Request, Response, NextFunction } from 'express';
// import { prisma } from '@newcondo/db';
// import jwt from 'jsonwebtoken';

// // Extend Express Request type
// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         id: string;
//         email: string;
//         role: string;
//         isPremium?: boolean;
//       };
//     }
//   }
// }

// // JWT secret from environment
// const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// /**
//  * Verify JWT token and attach user to request
//  */
// export const verifyToken = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     // Get token from Authorization header
//     const authHeader = req.headers.authorization;
    
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       res.status(401).json({
//         success: false,
//         message: 'No token provided. Please include Authorization header',
//       });
//       return;
//     }
    
//     const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
//     // Verify token
//     const decoded = jwt.verify(token, JWT_SECRET) as {
//       userId: string;
//       email: string;
//       role: string;
//     };
    
//     // Get user from database
//     const user = await prisma.user.findUnique({
//       where: { id: decoded.userId },
//       select: {
//         id: true,
//         email: true,
//         role: true,
//         isPremium: true,
//         verificationStatus: true,
//         isAvailableForMarking: true,
//       },
//     });
    
//     if (!user) {
//       res.status(401).json({
//         success: false,
//         message: 'User not found. Token may be invalid',
//       });
//       return;
//     }
    
//     // Attach user to request
//     req.user = {
//       id: user.id,
//       email: user.email,
//       role: user.role,
//       isPremium: user.isPremium,
//     };
    
//     next();
//   } catch (error) {
//     if (error instanceof jwt.JsonWebTokenError) {
//       res.status(401).json({
//         success: false,
//         message: 'Invalid token',
//       });
//       return;
//     }
    
//     if (error instanceof jwt.TokenExpiredError) {
//       res.status(401).json({
//         success: false,
//         message: 'Token has expired. Please login again',
//       });
//       return;
//     }
    
//     console.error('Error verifying token:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error authenticating user',
//     });
//   }
// };

// /**
//  * Check if user is an agent or premium renter
//  */
// export const requireAgentOrPremiumRenter = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
    
//     if (!userId) {
//       res.status(401).json({
//         success: false,
//         message: 'Authentication required',
//       });
//       return;
//     }
    
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         role: true,
//         isPremium: true,
//         verificationStatus: true,
//       },
//     });
    
//     if (!user) {
//       res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//       return;
//     }
    
//     const isAgent = user.role === 'AGENT';
//     const isPremiumRenter = user.role === 'RENTER' && user.isPremium;
    
//     if (!isAgent && !isPremiumRenter) {
//       res.status(403).json({
//         success: false,
//         message: 'Access denied. Only agents and premium renters can access marking services',
//       });
//       return;
//     }
    
//     next();
//   } catch (error) {
//     console.error('Error checking agent/premium status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error checking user permissions',
//     });
//   }
// };

// /**
//  * Check if user is verified
//  */
// export const requireVerifiedUser = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
    
//     if (!userId) {
//       res.status(401).json({
//         success: false,
//         message: 'Authentication required',
//       });
//       return;
//     }
    
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { verificationStatus: true },
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
//         message: 'Account verification required. Please complete identity verification',
//       });
//       return;
//     }
    
//     next();
//   } catch (error) {
//     console.error('Error checking verification status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error checking verification status',
//     });
//   }
// };

// /**
//  * Check if agent has marking service enabled
//  */
// export const requireMarkingServiceEnabled = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
    
//     if (!userId) {
//       res.status(401).json({
//         success: false,
//         message: 'Authentication required',
//       });
//       return;
//     }
    
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { isAvailableForMarking: true },
//     });
    
//     if (!user) {
//       res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//       return;
//     }
    
//     if (!user.isAvailableForMarking) {
//       res.status(403).json({
//         success: false,
//         message: 'Marking service is not enabled. Please enable it in your profile settings',
//       });
//       return;
//     }
    
//     next();
//   } catch (error) {
//     console.error('Error checking marking service status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error checking marking service status',
//     });
//   }
// };

// /**
//  * Check if user is a property owner or agent for marking job requests
//  */
// export const requireOwnerOrAgent = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
    
//     if (!userId) {
//       res.status(401).json({
//         success: false,
//         message: 'Authentication required',
//       });
//       return;
//     }
    
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { role: true, verificationStatus: true },
//     });
    
//     if (!user) {
//       res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//       return;
//     }
    
//     const isOwner = user.role === 'OWNER';
//     const isAgent = user.role === 'AGENT';
    
//     if (!isOwner && !isAgent) {
//       res.status(403).json({
//         success: false,
//         message: 'Access denied. Only property owners and agents can request marking services',
//       });
//       return;
//     }
    
//     if (user.verificationStatus !== 'VERIFIED') {
//       res.status(403).json({
//         success: false,
//         message: 'Account verification required to request marking services',
//       });
//       return;
//     }
    
//     next();
//   } catch (error) {
//     console.error('Error checking owner/agent status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error checking user permissions',
//     });
//   }
// };

// /**
//  * Check if user has a virtual account (required for payments)
//  */
// export const requireVirtualAccount = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
    
//     if (!userId) {
//       res.status(401).json({
//         success: false,
//         message: 'Authentication required',
//       });
//       return;
//     }
    
//     const virtualAccount = await prisma.virtualAccount.findFirst({
//       where: {
//         userId,
//         isActive: true,
//       },
//     });
    
//     if (!virtualAccount) {
//       res.status(403).json({
//         success: false,
//         message: 'Virtual account required. Please contact support to set up your account',
//       });
//       return;
//     }
    
//     next();
//   } catch (error) {
//     console.error('Error checking virtual account:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error checking virtual account',
//     });
//   }
// };

// /**
//  * Check agent reliability score threshold
//  */
// export const checkReliabilityScore = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     const MIN_RELIABILITY_SCORE = 2.5; // Minimum acceptable score out of 5
    
//     if (!userId) {
//       res.status(401).json({
//         success: false,
//         message: 'Authentication required',
//       });
//       return;
//     }
    
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         agentReliabilityScore: true,
//         totalMarkingJobs: true,
//       },
//     });
    
//     if (!user) {
//       res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//       return;
//     }
    
//     // Skip check for new agents (less than 5 jobs)
//     if (user.totalMarkingJobs && user.totalMarkingJobs < 5) {
//       next();
//       return;
//     }
    
//     // Check reliability score
//     if (
//       user.agentReliabilityScore &&
//       Number(user.agentReliabilityScore) < MIN_RELIABILITY_SCORE
//     ) {
//       res.status(403).json({
//         success: false,
//         message: `Your reliability score (${user.agentReliabilityScore}) is below the minimum requirement (${MIN_RELIABILITY_SCORE}). Please improve your service quality`,
//       });
//       return;
//     }
    
//     next();
//   } catch (error) {
//     console.error('Error checking reliability score:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error checking reliability score',
//     });
//   }
// };

// /**
//  * Verify shareable link token for anonymous markers
//  */
// export const verifyShareableLink = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { token } = req.params;
    
//     if (!token) {
//       res.status(400).json({
//         success: false,
//         message: 'Shareable link token is required',
//       });
//       return;
//     }
    
//     try {
//       // Decode token to get job ID
//       const decoded = jwt.verify(token, JWT_SECRET) as {
//         jobId: string;
//         expiresAt: number;
//       };
      
//       // Check if token has expired
//       if (Date.now() > decoded.expiresAt) {
//         res.status(401).json({
//           success: false,
//           message: 'Shareable link has expired',
//         });
//         return;
//       }
      
//       // Verify job exists and is pending
//       const job = await prisma.propertyMarkingJob.findUnique({
//         where: { id: decoded.jobId },
//         select: {
//           id: true,
//           status: true,
//           requestedBy: true,
//         },
//       });
      
//       if (!job) {
//         res.status(404).json({
//           success: false,
//           message: 'Marking job not found',
//         });
//         return;
//       }
      
//       if (job.status !== 'QUEUED' && job.status !== 'ASSIGNED') {
//         res.status(400).json({
//           success: false,
//           message: 'This marking job is no longer available',
//         });
//         return;
//       }
      
//       // Attach job info to request
//       req.markingJob = {
//         id: job.id,
//         requestedBy: job.requestedBy,
//       };
      
//       next();
//     } catch (jwtError) {
//       res.status(401).json({
//         success: false,
//         message: 'Invalid shareable link',
//       });
//       return;
//     }
//   } catch (error) {
//     console.error('Error verifying shareable link:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error verifying shareable link',
//     });
//   }
// };

// /**
//  * Rate limiting for marking job actions
//  */
// export const rateLimitMarkingActions = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id;
    
//     if (!userId) {
//       next();
//       return;
//     }
    
//     // Check recent actions in the last hour
//     const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
//     const recentActions = await prisma.propertyMarkingJob.count({
//       where: {
//         requestedBy: userId,
//         createdAt: {
//           gte: oneHourAgo,
//         },
//       },
//     });
    
//     // Limit: 5 marking job requests per hour
//     if (recentActions >= 5) {
//       res.status(429).json({
//         success: false,
//         message: 'Rate limit exceeded. Maximum 5 marking job requests per hour',
//       });
//       return;
//     }
    
//     next();
//   } catch (error) {
//     console.error('Error checking rate limit:', error);
//     // Don't block on rate limit check error
//     next();
//   }
// };

// // Extend Express Request to include marking job
// declare global {
//   namespace Express {
//     interface Request {
//       markingJob?: {
//         id: string;
//         requestedBy: string;
//       };
//     }
//   }
// }