import { faker } from "@faker-js/faker/locale/id_ID";
import { type CreateExamDto } from "./exam.types.js";

export const fakeExam = (overrides: Partial<CreateExamDto> = {}): CreateExamDto => {
  const startTime = faker.date.future();
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
  return {
    name: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    startTime,
    endTime,
    ...overrides,
  };
};
