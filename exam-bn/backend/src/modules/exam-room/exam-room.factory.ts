import { faker } from "@faker-js/faker/locale/id_ID";
import { type CreateExamRoomDto } from "./exam-room.types.js";

export const fakeExamRoom = (overrides: Partial<CreateExamRoomDto> = {}): CreateExamRoomDto => ({
  examId: faker.string.alphanumeric(25),
  roomId: faker.string.alphanumeric(25),
  ...overrides,
});
