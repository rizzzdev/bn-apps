import { type User, type CreateUserDto, type UpdateUserDto } from "./user.types.js";
import { type UserGetByIdQuery, type UserGetAllQuery } from "./user.query.js";
import { type Request, type Response, type NextFunction } from "express";

export interface IUserRepository {
  getAll(query: UserGetAllQuery): Promise<User[]>;
  getById(id: string, query: UserGetByIdQuery): Promise<User | null>;
  getByUsername(username: string): Promise<User | null>;
  create(dto: CreateUserDto): Promise<User>;
  updateById(id: string, dto: UpdateUserDto): Promise<User>;
  deleteById(id: string): Promise<User>;
}

export interface IUserService {
  getAll(query: UserGetAllQuery): Promise<User[]>;
  getById(id: string, query: UserGetByIdQuery): Promise<User>;
  create(dto: CreateUserDto): Promise<User>;
  importMany(rows: CreateUserDto[]): Promise<{ created: number; errors: string[] }>;
  updateById(id: string, dto: UpdateUserDto): Promise<User>;
  deleteById(id: string): Promise<User>;
}

export interface IUserController {
  getAll(request: Request, response: Response, next: NextFunction): void;
  getById(request: Request, response: Response, next: NextFunction): void;
  create(request: Request, response: Response, next: NextFunction): void;
  downloadTemplate(request: Request, response: Response, next: NextFunction): void;
  importExcel(request: Request, response: Response, next: NextFunction): void;
  updateById(request: Request, response: Response, next: NextFunction): void;
  deleteById(request: Request, response: Response, next: NextFunction): void;
}
