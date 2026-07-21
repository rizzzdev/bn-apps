import {
  type LoginAudit,
  type CreateLoginAuditDto,
  type UpdateLoginAuditDto,
} from "./login-audit.types.js";
import { type ILoginAuditRepository, type ILoginAuditService } from "./login-audit.interface.js";
import { type LoginAuditGetByIdQuery, type LoginAuditGetAllQuery } from "./login-audit.query.js";
import { NotFoundError } from "../../utils/errors.js";

/** Handles LoginAudit business logic. Depends on ILoginAuditRepository. */
export class LoginAuditService implements ILoginAuditService {
  constructor(private readonly repository: ILoginAuditRepository) {}

  getAll = async (query: LoginAuditGetAllQuery): Promise<LoginAudit[]> => {
    return this.repository.getAll(query);
  };

  getById = async (id: string, query: LoginAuditGetByIdQuery): Promise<LoginAudit> => {
    const data = await this.repository.getById(id, query);
    if (!data) {
      throw new NotFoundError("Login audit not found");
    }
    return data;
  };

  create = async (dto: CreateLoginAuditDto): Promise<LoginAudit> => {
    return this.repository.create(dto);
  };

  updateById = async (id: string, dto: UpdateLoginAuditDto): Promise<LoginAudit> => {
    const existing = await this.getById(id, {});
    if (Object.keys(dto).length === 0) {
      return existing;
    }
    return this.repository.updateById(id, dto);
  };

  deleteById = async (id: string): Promise<LoginAudit> => {
    await this.getById(id, {});
    return this.repository.deleteById(id);
  };
}
