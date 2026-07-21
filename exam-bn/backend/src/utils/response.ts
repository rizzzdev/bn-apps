import { type Response } from "express";
import { type ApiResponse, StatusCode, type SuccessStatusCode } from "../types/api.js";

export const sendSuccess = <T>({
  response,
  data,
  message = "Success",
  statusCode = StatusCode.OK,
}: {
  response: Response;
  data: T;
  message?: string;
  statusCode?: SuccessStatusCode;
}): void => {
  const body: ApiResponse<T> = { error: false, statusCode, message, data };
  response.status(statusCode).json(body);
};

export const sendError = (
  response: Response,
  message: string,
  statusCode: StatusCode = StatusCode.INTERNAL_SERVER_ERROR,
): void => {
  const body: ApiResponse<null> = { error: true, statusCode, message, data: null };
  response.status(statusCode).json(body);
};
