import express from 'express';
import { corsConfig } from '@/configs/cors.js';
import { appRoutes } from './routes.js';
import { sentriAuth } from '@/lib/sentri.js'; // From sentri init

export const createServer = () => {
  const app = express();

  // Middleware global
  app.use(corsConfig);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Expose public folder untuk static files
  app.use(express.static('public'));

  // Mount auth router if needed, or public routes
  // app.use('/api/v1/auth', sentriAuth.router());

  // Mount semua module routes
  app.use('/api/v1', appRoutes);

  // Error handler
  app.use(sentriAuth.errorHandler({
    onUnhandled: (error) => {
      console.log({error})
    }
  }));

  return app;
};
