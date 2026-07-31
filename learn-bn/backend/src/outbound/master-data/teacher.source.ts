import type { ITeacherPort, Teacher } from "./teacher.port";
import { HttpTeacherAdapter } from "./teacher.http-adapter";

/**
 * Orchestrator / composition root for the Teacher port.
 * Wraps HttpTeacherAdapter today; the next plug point (Phase 2) is a
 * Redis-TTL caching decorator that will sit BETWEEN this orchestrator and
 * the HTTP adapter without changing the consumer code.
 */
export class TeacherMasterDataSource implements ITeacherPort {
  constructor(private readonly adapter: ITeacherPort = new HttpTeacherAdapter()) {}

  async getById(id: string): Promise<Teacher | null> {
    return this.adapter.getById(id);
  }

  async getByIds(ids: string[]): Promise<Teacher[]> {
    return this.adapter.getByIds(ids);
  }
}

export const teacherMasterDataSource = new TeacherMasterDataSource();
