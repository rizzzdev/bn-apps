import { Router } from 'express';
import { sentriAuth } from './src/lib/sentri.js';
import { userRoute } from './src/modules/user/route/user.route.js';

export const authRouter = Router();
authRouter.use(sentriAuth.router());
authRouter.use('/users', sentriAuth.protect(), userRoute);

export { sentriAuth };
