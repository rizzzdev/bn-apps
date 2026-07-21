import 'dotenv/config';
import { createAuthExpress } from 'sentri/express';

type Role = 'super_admin' | 'teacher' | 'student';

export const sentriAuth = createAuthExpress<Role>({
  mode: 'client',
  keyUri: process.env.MASTER_API_URL! + "/api/v1/auth/keys",
  validRoles: ['super_admin', 'teacher', 'student'],
});

declare global {
  namespace Express {
    interface Request {
      profileId?: string;
    }
  }
}
