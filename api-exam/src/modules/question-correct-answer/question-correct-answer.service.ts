import {
  type QuestionCorrectAnswer,
  type CreateQuestionCorrectAnswerDto,
  type UpdateQuestionCorrectAnswerDto,
} from "./question-correct-answer.types.js";
import {
  type IQuestionCorrectAnswerRepository,
  type IQuestionCorrectAnswerService,
} from "./question-correct-answer.interface.js";
import {
  type QuestionCorrectAnswerGetByIdQuery,
  type QuestionCorrectAnswerGetAllQuery,
} from "./question-correct-answer.query.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";

/** Handles QuestionCorrectAnswer business logic. Depends on IQuestionCorrectAnswerRepository. */
export class QuestionCorrectAnswerService implements IQuestionCorrectAnswerService {
  constructor(private readonly repository: IQuestionCorrectAnswerRepository) {}

  getAll = async (query: QuestionCorrectAnswerGetAllQuery): Promise<QuestionCorrectAnswer[]> => {
    return this.repository.getAll(query);
  };

  getById = async (
    id: string,
    query: QuestionCorrectAnswerGetByIdQuery,
  ): Promise<QuestionCorrectAnswer> => {
    const data = await this.repository.getById(id, query);
    if (!data) {
      throw new NotFoundError("Question correct answer not found");
    }
    return data;
  };

  /** Throws BadRequestError if a correct answer already exists for this question. */
  private assertQuestionHasNoAnswer = async (
    questionId: string,
    excludeId?: string,
  ): Promise<void> => {
    const existing = await this.repository.getByQuestionId(questionId);
    if (existing && existing.id !== excludeId) {
      throw new BadRequestError("A correct answer already exists for this question");
    }
  };

  create = async (dto: CreateQuestionCorrectAnswerDto): Promise<QuestionCorrectAnswer> => {
    await this.assertQuestionHasNoAnswer(dto.questionId);
    return this.repository.create(dto);
  };

  updateById = async (
    id: string,
    dto: UpdateQuestionCorrectAnswerDto,
  ): Promise<QuestionCorrectAnswer> => {
    const existing = await this.getById(id, {});
    if (Object.keys(dto).length === 0) {
      return existing;
    }
    if (dto.questionId !== undefined) {
      await this.assertQuestionHasNoAnswer(dto.questionId, id);
    }
    return this.repository.updateById(id, dto);
  };

  deleteById = async (id: string): Promise<QuestionCorrectAnswer> => {
    await this.getById(id, {});
    return this.repository.deleteById(id);
  };
}
