// src/lib/auth/index.ts
// Barrel export para módulo de autenticação

// Handler de autenticação (socket events)
export { registerAuthHandlers } from "./auth.handler";

// JWT
export { generateToken, verifyToken, decodeToken } from "./jwt";
export type { JwtPayload } from "./jwt";

// Rate Limiter
export { rateLimiter } from "./rate-limiter";

// Validators
export {
  isValidEmail,
  isValidUsername,
  isValidPassword,
  sanitizeString,
} from "./validators";

// Middleware
export {
  requireAuth,
  isAuthenticated,
  getUserId,
  requireUserId,
  getSocketIdentifier,
} from "./middleware";
