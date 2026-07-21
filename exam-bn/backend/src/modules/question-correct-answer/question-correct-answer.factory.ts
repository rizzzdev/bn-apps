import { faker } from "@faker-js/faker/locale/id_ID";
import { type CreateQuestionCorrectAnswerDto } from "./question-correct-answer.types.js";

export const fakeQuestionCorrectAnswer = (
  overrides: Partial<CreateQuestionCorrectAnswerDto> = {},
): CreateQuestionCorrectAnswerDto => ({
  questionId: faker.string.alphanumeric(25),
  optionId: faker.string.alphanumeric(25),
  ...overrides,
});
