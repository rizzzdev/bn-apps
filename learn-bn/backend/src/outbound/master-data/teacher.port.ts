/**
 * Outbound Port for Teacher data sourced from master-data service.
 * Hexagonal architecture: domain interface that the consumer depends on.
 * Implementations (HTTP adapter) live alongside in `teacher.http-adapter.ts`.
 */

export type TeacherStatus = 'Aktif' | 'Tidak Aktif' | 'Cuti' | 'Pensiun' | (string & {});

export interface Teacher {
  id: string;
  fullname: string;
  nip: string | null;
  email: string | null;
  phone: string | null;
  nik: string | null;
  birthplace: string | null;
  /** ISO-8601 string. Adapter normalizes to UTC. */
  birthdate: string | null;
  gender: string | null;
  address: string | null;
  position: string | null;
  picture_url: string | null;
  prefix_title: string | null;
  suffix_title: string | null;
  status: TeacherStatus;
  active_academic_year_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Port contract - every adapter (HTTP today, gRPC tomorrow, ...) must
 * satisfy this. Use `teacherMasterDataSource` (in `teacher.source.ts`) as
 * the composition-root singleton entry point.
 *
 * NOTE: `getByIds` is currently implemented by parallel `getById` calls
 * (see HttpTeacherAdapter) because master-data-bn does not yet expose a
 * batch endpoint. Replace with a single call once batch endpoint lands.
 */
export interface ITeacherPort {
  getById(id: string): Promise<Teacher | null>;
  getByIds(ids: string[]): Promise<Teacher[]>;
}
