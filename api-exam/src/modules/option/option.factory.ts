import { faker } from "@faker-js/faker/locale/id_ID";
import { type CreateOptionDto } from "./option.types.js";

export const fakeOption = (overrides: Partial<CreateOptionDto> = {}): CreateOptionDto => ({
  questionId: faker.string.alphanumeric(25),
  text: faker.lorem.sentence(),
  ...overrides,
});
