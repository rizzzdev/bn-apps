import { type Server } from "socket.io";
import {
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from "./socket.types.js";

type ExamServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

let _io: ExamServer | null = null;

export const setIO = (io: ExamServer): void => {
  _io = io;
};
export const getIO = (): ExamServer | null => _io;
