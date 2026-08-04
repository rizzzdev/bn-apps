import { type Option, type CreateOptionDto, type UpdateOptionDto } from "./option.types.js";
import { type IOptionRepository, type IOptionService } from "./option.interface.js";
import { type OptionGetByIdQuery, type OptionGetAllQuery } from "./option.query.js";
import { NotFoundError } from "#app/errors/index.js";

/** Handles Option business logic. Depends on IOptionRepository. */
export class OptionService implements IOptionService {
  constructor(private readonly repository: IOptionRepository) {}

  getAll = async (query: OptionGetAllQuery): Promise<Option[]> => {
    return this.repository.getAll(query);
  };

  getById = async (id: string, query: OptionGetByIdQuery): Promise<Option> => {
    const data = await this.repository.getById(id, query);
    if (!data) {
      throw new NotFoundError("Option not found");
    }
    return data;
  };

  create = async (dto: CreateOptionDto): Promise<Option> => {
    return this.repository.create(dto);
  };

  updateById = async (id: string, dto: UpdateOptionDto): Promise<Option> => {
    const existing = await this.getById(id, {});
    if (Object.keys(dto).length === 0) {
      return existing;
    }
    return this.repository.updateById(id, dto);
  };

  deleteById = async (id: string): Promise<Option> => {
    await this.getById(id, {});
    return this.repository.deleteById(id);
  };
}
