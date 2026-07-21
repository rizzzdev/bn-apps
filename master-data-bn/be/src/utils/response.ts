import { Response } from 'express';

export type Pagination = {
  currentPage: number;
  totalPage: number;
  totalData: number;
  dataPerPage: number;
};

export type ApiResponse<T> = {
  error: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  pagination?: Pagination;
};

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null,
  pagination?: Pagination,
  error: boolean = false
) => {
  const response: ApiResponse<T> = {
    error,
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
  return sendResponse(res, statusCode, message, null, undefined, true);
};
