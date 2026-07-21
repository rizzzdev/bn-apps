import { type Room as RoomBase } from "../../app/database/generated/client.js";
import { type z } from "zod";
import { type createRoomSchema, type updateRoomSchema } from "./room.schema.js";

export type Room = RoomBase & {
  examRooms?: unknown[];
};

export type CreateRoomDto = z.infer<typeof createRoomSchema>;
export type UpdateRoomDto = z.infer<typeof updateRoomSchema>;
