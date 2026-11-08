import rateLimit from 'express-rate-limit';

const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);

/**
 * General API Rate Limiter
 * 500 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  skip: () => isTestEnv,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});

/**
 * Strict Authentication Rate Limiter
 * 30 attempts per 15 minutes to prevent brute-force attacks on login / register
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skip: () => isTestEnv,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * AI & Multimodal Order Extraction Rate Limiter
 * 20 requests per minute to prevent LLM quota / budget exhaustion
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  skip: () => isTestEnv,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'AI order extraction rate limit exceeded. Please wait a moment before sending more requests.',
  },
});
