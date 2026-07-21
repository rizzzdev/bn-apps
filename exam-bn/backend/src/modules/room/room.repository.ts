import { type PrismaClient } from "../../app/database/generated/client.js";
import { type Room, type CreateRoomDto, type UpdateRoomDto } from "./room.types.js";
import { type IRoomRepository } from "./room.interface.js";
import { type RoomGetByIdQuery, type RoomGetAllQuery } from "./room.query.js";
import { ALIVE } from "../../utils/constants.js";

/** Handles all Room database operations via Prisma. Contains no business logic. */
export class RoomRepository implements IRoomRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getAll = (query: RoomGetAllQuery): Promise<Room[]> => {
    const { page = 1, limit = 10 } = query;
    return this.prisma.room.findMany({
      where: {
        deletedAt: ALIVE,
        ...(query.name !== undefined && {
          name: { contains: query.name, mode: "insensitive" },
        }),
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }) as unknown as Promise<Room[]>;
  };

  getById = (id: string, _query: RoomGetByIdQuery): Promise<Room | null> => {
    return this.prisma.room.findFirst({
      where: { id, deletedAt: ALIVE },
    }) as unknown as Promise<Room | null>;
  };

  create = (dto: CreateRoomDto): Promise<Room> => {
    return this.prisma.room.create({ data: dto }) as unknown as Promise<Room>;
  };

  updateById = (id: string, dto: UpdateRoomDto): Promise<Room> => {
    return this.prisma.room.update({ where: { id }, data: dto }) as unknown as Promise<Room>;
  };

  deleteById = (id: string): Promise<Room> => {
    return this.prisma.room.update({
      where: { id },
      data: { deletedAt: new Date() },
    }) as unknown as Promise<Room>;
  };
}
