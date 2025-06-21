// backend/auth-service/src/routes/refresh.ts
import { Router } from 'express'
import { refreshTokenController } from '../controllers/refreshTokenController'
import { refreshTokenMiddleware, rateLimitByUser } from '../middleware/sessionMiddleware'

const router = Router()

// Rate limit refresh token requests
router.use(rateLimitByUser(10, 15 * 60 * 1000)) // 10 requests per 15 minutes

// Refresh access token
router.post('/', refreshTokenMiddleware, refreshTokenController.refreshAccessToken)

// Revoke refresh token (logout)
router.delete('/', refreshTokenMiddleware, refreshTokenController.revokeRefreshToken)

export default router