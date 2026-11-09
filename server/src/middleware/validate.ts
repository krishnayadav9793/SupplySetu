import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Reusable Express request validation middleware for Zod schemas
 */
export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Assign parsed sanitized data
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) (req as any).query = parsed.query;
      if (parsed.params) (req as any).params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.errors[0];
        res.status(400).json({
          success: false,
          message: firstIssue?.message || 'Validation error',
          errors: error.errors.map((err) => ({
            field: err.path.slice(1).join('.'),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
