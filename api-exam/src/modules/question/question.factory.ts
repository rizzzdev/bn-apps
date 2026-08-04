import { faker } from "@faker-js/faker/locale/id_ID";
import { type CreateQuestionDto, QuestionTypeValues } from "./question.types.js";

export const fakeQuestion = (overrides: Partial<CreateQuestionDto> = {}): CreateQuestionDto => ({
  text: faker.lorem.sentence() + "?",
  type: faker.helpers.arrayElement(QuestionTypeValues),
  ...overrides,
});
