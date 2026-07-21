import type { Response } from 'express';

export type ApiResponse<T> = {
  error: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  pagination?: {
    currentPage: number;
    totalPage: number;
    totalData: number;
    dataPerPage: number;
  };
};

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null,
  pagination?: ApiResponse<T>['pagination']
) => {
  const response: ApiResponse<T> = {
    error: false,
    statusCode,
    message,
    data,
    ...(pagination && { pagination })
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string
) => {
  const response: ApiResponse<null> = {
    error: true,
    statusCode,
    message,
    data: null
  };
  return res.status(statusCode).json(response);
};
