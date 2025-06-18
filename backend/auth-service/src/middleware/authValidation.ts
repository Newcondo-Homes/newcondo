import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { sendResponse } from '../../../shared/src/utils/response'

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      next()
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || 'Validation failed'
      sendResponse(res, 400, errorMessage, null)
    }
  }
}