import { type Application, json, urlencoded } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { errorHandler } from "./errorHandler.js";
import { requestLogger } from "./requestLogger.js";

import { corsConfig } from "../../configs/cors.config.js";

export const registerMiddlewares = (app: Application): void => {
  app.use(helmet());
  app.use(cors(corsConfig));

  app.use(compression());
  app.use(requestLogger);
  app.use(cookieParser());
  app.use(json({ limit: "10mb" }));
  app.use(urlencoded({ extended: true, limit: "10mb" }));
};

export const registerErrorHandler = (app: Application): void => {
  app.use(errorHandler);
};
