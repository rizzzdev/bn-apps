import { faker } from "@faker-js/faker/locale/id_ID";
import { type CreateRoomDto } from "./room.types.js";

export const fakeRoom = (overrides: Partial<CreateRoomDto> = {}): CreateRoomDto => ({
  name: `Ruang ${faker.helpers.arrayElement(["A", "B", "C", "D", "E"])}${faker.number.int({ min: 1, max: 10 })}`,
  capacity: faker.number.int({ min: 20, max: 40 }),
  ...overrides,
});
