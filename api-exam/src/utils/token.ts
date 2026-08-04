import jwt from "jsonwebtoken";
import { envConfig } from "../configs/env.config.js";

export const signAccessToken = (payload: object): string => {
  return jwt.sign(payload, envConfig.accessTokenSecretKey!, { expiresIn: "15m" });
};

export const signRefreshToken = (payload: object): string => {
  return jwt.sign(payload, envConfig.refreshTokenSecretKey!, { expiresIn: "1d" });
};

export const verifyAccessToken = (token: string): jwt.JwtPayload => {
  return jwt.verify(token, envConfig.accessTokenSecretKey!) as jwt.JwtPayload;
};

export const verifyRefreshToken = (token: string): jwt.JwtPayload => {
  return jwt.verify(token, envConfig.refreshTokenSecretKey!) as jwt.JwtPayload;
};
