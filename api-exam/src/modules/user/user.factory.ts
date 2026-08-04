import { faker } from "@faker-js/faker/locale/id_ID";
import { type CreateUserDto, UserRoleValues } from "./user.types.js";

export const fakeUser = (overrides: Partial<CreateUserDto> = {}): CreateUserDto => ({
  fullname: faker.person.fullName(),
  username: faker.internet.username(),
  passwordHash: faker.internet.password({ length: 12 }),
  role: faker.helpers.arrayElement(UserRoleValues),
  ...overrides,
});
