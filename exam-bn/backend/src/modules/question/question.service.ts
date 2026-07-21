import { type Question, type CreateQuestionDto, type UpdateQuestionDto } from "./question.types.js";
import { type IQuestionRepository, type IQuestionService } from "./question.interface.js";
import { type QuestionGetByIdQuery, type QuestionGetAllQuery } from "./question.query.js";
import { NotFoundError } from "../../utils/errors.js";

/** Handles Question business logic. Depends on IQuestionRepository. */
export class QuestionService implements IQuestionService {
  constructor(private readonly repository: IQuestionRepository) {}

  getAll = async (query: QuestionGetAllQuery): Promise<Question[]> => {
    return this.repository.getAll(query);
  };

  getById = async (id: string, query: QuestionGetByIdQuery): Promise<Question> => {
    const data = await this.repository.getById(id, query);
    if (!data) {
      throw new NotFoundError("Question not found");
    }
    return data;
  };

  create = async (dto: CreateQuestionDto): Promise<Question> => {
    return this.repository.create(dto);
  };

  updateById = async (id: string, dto: UpdateQuestionDto): Promise<Question> => {
    const existing = await this.getById(id, {});
    if (Object.keys(dto).length === 0) {
      return existing;
    }
    return this.repository.updateById(id, dto);
  };

  deleteById = async (id: string): Promise<Question> => {
    await this.getById(id, {});
    return this.repository.deleteById(id);
  };
}
