import { type Room, type CreateRoomDto, type UpdateRoomDto } from "./room.types.js";
import { type IRoomRepository, type IRoomService } from "./room.interface.js";
import { type RoomGetByIdQuery, type RoomGetAllQuery } from "./room.query.js";
import { NotFoundError } from "../../utils/errors.js";
import { redisClient } from "../../configs/redis.config.js";

/** Handles Room business logic. Depends on IRoomRepository. */
export class RoomService implements IRoomService {
  constructor(private readonly repository: IRoomRepository) {}

  getAll = async (query: RoomGetAllQuery): Promise<Room[]> => {
    const version = await redisClient.get("cache_version:room") || "0";
    const cacheKey = `rooms:list:v${version}:${JSON.stringify(query)}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await this.repository.getAll(query);
    
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 86400 }); // 24 hours
    return data;
  };

  private invalidateCache = async (): Promise<void> => {
    await redisClient.incr("cache_version:room");
  };

  getById = async (id: string, query: RoomGetByIdQuery): Promise<Room> => {
    const data = await this.repository.getById(id, query);
    if (!data) {
      throw new NotFoundError("Room not found");
    }
    return data;
  };

  create = async (dto: CreateRoomDto): Promise<Room> => {
    const data = await this.repository.create(dto);
    await this.invalidateCache();
    return data;
  };

  updateById = async (id: string, dto: UpdateRoomDto): Promise<Room> => {
    const existing = await this.getById(id, {});
    if (Object.keys(dto).length === 0) {
      return existing;
    }
    const data = await this.repository.updateById(id, dto);
    await this.invalidateCache();
    return data;
  };

  deleteById = async (id: string): Promise<Room> => {
    await this.getById(id, {});
    const data = await this.repository.deleteById(id);
    await this.invalidateCache();
    return data;
  };
}
