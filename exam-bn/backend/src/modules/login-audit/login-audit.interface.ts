import {
  type LoginAudit,
  type CreateLoginAuditDto,
  type UpdateLoginAuditDto,
} from "./login-audit.types.js";
import { type LoginAuditGetByIdQuery, type LoginAuditGetAllQuery } from "./login-audit.query.js";
import { type Request, type Response, type NextFunction } from "express";

export interface ILoginAuditRepository {
  getAll(query: LoginAuditGetAllQuery): Promise<LoginAudit[]>;
  getById(id: string, query: LoginAuditGetByIdQuery): Promise<LoginAudit | null>;
  create(dto: CreateLoginAuditDto): Promise<LoginAudit>;
  updateById(id: string, dto: UpdateLoginAuditDto): Promise<LoginAudit>;
  deleteById(id: string): Promise<LoginAudit>;
}

export interface ILoginAuditService {
  getAll(query: LoginAuditGetAllQuery): Promise<LoginAudit[]>;
  getById(id: string, query: LoginAuditGetByIdQuery): Promise<LoginAudit>;
  create(dto: CreateLoginAuditDto): Promise<LoginAudit>;
  updateById(id: string, dto: UpdateLoginAuditDto): Promise<LoginAudit>;
  deleteById(id: string): Promise<LoginAudit>;
}

export interface ILoginAuditController {
  getAll(request: Request, response: Response, next: NextFunction): void;
  getById(request: Request, response: Response, next: NextFunction): void;
  create(request: Request, response: Response, next: NextFunction): void;
  updateById(request: Request, response: Response, next: NextFunction): void;
  deleteById(request: Request, response: Response, next: NextFunction): void;
}
