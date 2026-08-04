import { type Option, type CreateOptionDto, type UpdateOptionDto } from "./option.types.js";
import { type OptionGetByIdQuery, type OptionGetAllQuery } from "./option.query.js";
import { type Request, type Response, type NextFunction } from "express";

export interface IOptionRepository {
  getAll(query: OptionGetAllQuery): Promise<Option[]>;
  getById(id: string, query: OptionGetByIdQuery): Promise<Option | null>;
  create(dto: CreateOptionDto): Promise<Option>;
  updateById(id: string, dto: UpdateOptionDto): Promise<Option>;
  deleteById(id: string): Promise<Option>;
}

export interface IOptionService {
  getAll(query: OptionGetAllQuery): Promise<Option[]>;
  getById(id: string, query: OptionGetByIdQuery): Promise<Option>;
  create(dto: CreateOptionDto): Promise<Option>;
  updateById(id: string, dto: UpdateOptionDto): Promise<Option>;
  deleteById(id: string): Promise<Option>;
}

export interface IOptionController {
  getAll(request: Request, response: Response, next: NextFunction): void;
  getById(request: Request, response: Response, next: NextFunction): void;
  create(request: Request, response: Response, next: NextFunction): void;
  updateById(request: Request, response: Response, next: NextFunction): void;
  deleteById(request: Request, response: Response, next: NextFunction): void;
}
