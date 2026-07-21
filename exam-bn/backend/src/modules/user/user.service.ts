import { type User, type CreateUserDto, type UpdateUserDto } from "./user.types.js";
import { type IUserRepository, type IUserService } from "./user.interface.js";
import { type UserGetByIdQuery, type UserGetAllQuery } from "./user.query.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { hash } from "../../utils/hash.js";

/**
 * Handles User business logic: 404 enforcement, uniqueness checks, and password hashing.
 * Depends on IUserRepository — never calls Prisma directly.
 */
export class UserService implements IUserService {
  constructor(private readonly repository: IUserRepository) {}

  getAll = async (query: UserGetAllQuery): Promise<User[]> => {
    return this.repository.getAll(query);
  };

  getById = async (id: string, query: UserGetByIdQuery): Promise<User> => {
    const data = await this.repository.getById(id, query);
    if (!data) {
      throw new NotFoundError("User not found");
    }
    return data;
  };

  /** Throws BadRequestError if another alive user already holds this username. */
  private assertUsernameUnique = async (username: string, excludeId?: string): Promise<void> => {
    const existing = await this.repository.getByUsername(username);
    if (existing && existing.id !== excludeId) {
      throw new BadRequestError("Username already in use");
    }
  };

  create = async (dto: CreateUserDto): Promise<User> => {
    await this.assertUsernameUnique(dto.username);
    const passwordHash = await hash(dto.passwordHash);
    return this.repository.create({ ...dto, passwordHash });
  };

  importMany = async (rows: CreateUserDto[]): Promise<{ created: number; errors: string[] }> => {
    let created = 0;
    const errors: string[] = [];
    for (const dto of rows) {
      try {
        await this.create(dto);
        created++;
      } catch (e: unknown) {
        errors.push(`${dto.username}: ${(e as Error).message}`);
      }
    }
    return { created, errors };
  };

  updateById = async (id: string, dto: UpdateUserDto): Promise<User> => {
    const existing = await this.getById(id, {});
    if (Object.keys(dto).length === 0) {
      return existing;
    }
    if (dto.username !== undefined) {
      await this.assertUsernameUnique(dto.username, id);
    }
    if (dto.passwordHash !== undefined) {
      dto = { ...dto, passwordHash: await hash(dto.passwordHash) };
    }
    return this.repository.updateById(id, dto);
  };

  deleteById = async (id: string): Promise<User> => {
    await this.getById(id, {});
    return this.repository.deleteById(id);
  };
}
