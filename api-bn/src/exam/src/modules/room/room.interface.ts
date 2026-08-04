import { type Room, type CreateRoomDto, type UpdateRoomDto } from './room.types.js';
import { type RoomGetByIdQuery, type RoomGetAllQuery } from './room.query.js';
import { type Request, type Response, type NextFunction } from 'express';

export interface IRoomRepository {
  getAll(query: RoomGetAllQuery): Promise<Room[]>;
  getById(id: string, query: RoomGetByIdQuery): Promise<Room | null>;
  create(dto: CreateRoomDto): Promise<Room>;
  updateById(id: string, dto: UpdateRoomDto): Promise<Room>;
  deleteById(id: string): Promise<Room>;
}

export interface IRoomService {
  getAll(query: RoomGetAllQuery): Promise<Room[]>;
  getById(id: string, query: RoomGetByIdQuery): Promise<Room>;
  create(dto: CreateRoomDto): Promise<Room>;
  updateById(id: string, dto: UpdateRoomDto): Promise<Room>;
  deleteById(id: string): Promise<Room>;
}

export interface IRoomController {
  getAll(request: Request, response: Response, next: NextFunction): void;
  getById(request: Request, response: Response, next: NextFunction): void;
  create(request: Request, response: Response, next: NextFunction): void;
  updateById(request: Request, response: Response, next: NextFunction): void;
  deleteById(request: Request, response: Response, next: NextFunction): void;
}
