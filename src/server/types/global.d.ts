import type { JWTPayload } from '../middleware/auth';

declare global {
  namespace Express {
    interface User extends JWTPayload {}
  }
}
