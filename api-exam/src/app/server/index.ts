import express, { type Application } from "express";
import { registerMiddlewares, registerErrorHandler } from "../middlewares/index.js";
import { registerRoutes } from "../routes/index.js";

export const createApp = (): Application => {
  const app = express();

  registerMiddlewares(app);
  registerRoutes(app);
  registerErrorHandler(app);

  return app;
};
