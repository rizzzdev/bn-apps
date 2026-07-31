import 'dotenv/config';
import { createAuthExpress } from 'sentri/express';
export const sentriAuth = createAuthExpress({
    mode: 'client',
    keyUri: process.env.MASTER_API_URL + "/api/v1/auth/keys",
    validRoles: ['super_admin', 'teacher', 'student'],
});
