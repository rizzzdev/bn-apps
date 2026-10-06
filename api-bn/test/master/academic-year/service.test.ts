import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { academicyearService } from '../../../src/master/src/modules/academic-year/service/academic-year.service.ts';
import { prisma } from '../../../src/master/src/database/index.ts';
import { resetMasterDb } from '../../support/db.ts';

beforeEach(async () => {
  await resetMasterDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('AcademicYearService.create', () => {
  it('membuat tahun ajaran dan otomatis mengisi endYear & code jika tidak diberikan', async () => {
    const created = await academicyearService.create({ startYear: 2025 } as any);

    expect(created.endYear).toBe(2026);
    expect(created.code).toBe('2025/2026');
    expect(created.status).toBe('Tidak_Aktif');
  });

  it('menolak endYear yang bukan tepat 1 tahun setelah startYear', async () => {
    await expect(
      academicyearService.create({ startYear: 2025, endYear: 2030 } as any)
    ).rejects.toThrow('Tahun Selesai harus tepat 1 tahun setelah Tahun Mulai');
  });

  it('menolak code yang duplikat', async () => {
    await academicyearService.create({ startYear: 2025, code: '2025/2026' } as any);

    await expect(
      academicyearService.create({ startYear: 2025, code: '2025/2026' } as any)
    ).rejects.toThrow('Academic year code already exists');
  });

  it('rollover: mengaktifkan tahun ajaran baru otomatis menonaktifkan (Selesai) yang lama', async () => {
    const first = await academicyearService.create({ startYear: 2024, status: 'Aktif' } as any);
    const second = await academicyearService.create({ startYear: 2025, status: 'Aktif' } as any);

    const firstReloaded = await prisma.academicYear.findUnique({ where: { id: first.id } });
    expect(firstReloaded?.status).toBe('Selesai');
    expect(second.status).toBe('Aktif');
  });
});

describe('AcademicYearService.getById / getAll', () => {
  it('melempar NotFoundError untuk id yang tidak ada', async () => {
    await expect(academicyearService.getById('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
      'AcademicYear not found'
    );
  });

  it('getAll mengembalikan data & total sesuai jumlah yang dibuat', async () => {
    await academicyearService.create({ startYear: 2024 } as any);
    await academicyearService.create({ startYear: 2025 } as any);

    const { data, total } = await academicyearService.getAll(1, 10);
    expect(total).toBe(2);
    expect(data).toHaveLength(2);
  });

  it('getAll dengan search hanya mengembalikan yang cocok', async () => {
    await academicyearService.create({ startYear: 2024, code: '2024/2025' } as any);
    await academicyearService.create({ startYear: 2025, code: '2025/2026' } as any);

    const { data, total } = await academicyearService.getAll(1, 10, '2024');
    expect(total).toBe(1);
    expect(data[0]?.code).toBe('2024/2025');
  });
});

describe('AcademicYearService.update', () => {
  it('memperbarui code otomatis saat startYear berubah', async () => {
    const created = await academicyearService.create({ startYear: 2025 } as any);
    const updated = await academicyearService.update(created.id, { startYear: 2026 } as any);

    expect(updated.startYear).toBe(2026);
    expect(updated.endYear).toBe(2027);
    expect(updated.code).toBe('2026/2027');
  });

  it('menolak update yang membuat endYear tidak valid', async () => {
    const created = await academicyearService.create({ startYear: 2025 } as any);
    await expect(
      academicyearService.update(created.id, { endYear: 2099 } as any)
    ).rejects.toThrow('Tahun Selesai harus tepat 1 tahun setelah Tahun Mulai');
  });
});

describe('AcademicYearService.delete', () => {
  it('menghapus (soft delete) tahun ajaran tanpa semester aktif', async () => {
    const created = await academicyearService.create({ startYear: 2025 } as any);
    await academicyearService.delete(created.id);

    const found = await prisma.academicYear.findUnique({ where: { id: created.id } });
    expect(found?.deletedAt).not.toBeNull();
  });

  it('menolak hapus tahun ajaran yang masih punya semester aktif', async () => {
    const created = await academicyearService.create({ startYear: 2025 } as any);
    await prisma.semester.create({
      data: { type: 'Ganjil', academicYearId: created.id },
    });

    await expect(academicyearService.delete(created.id)).rejects.toThrow(
      'Cannot delete Academic Year because it still has active Semesters.'
    );
  });
});

describe('AcademicYearService batch operations', () => {
  it('getBatchByIds memisahkan id yang ditemukan dan tidak', async () => {
    const created = await academicyearService.create({ startYear: 2025 } as any);
    const { found, notFound } = await academicyearService.getBatchByIds([
      created.id,
      '00000000-0000-0000-0000-000000000000',
    ]);

    expect(found).toHaveLength(1);
    expect(notFound).toEqual(['00000000-0000-0000-0000-000000000000']);
  });

  it('bulkDelete menghapus semua id sekaligus dalam satu transaksi', async () => {
    const a = await academicyearService.create({ startYear: 2024 } as any);
    const b = await academicyearService.create({ startYear: 2025 } as any);

    const result = await academicyearService.bulkDelete([a.id, b.id]);
    expect(result).toBe(true);

    const remaining = await prisma.academicYear.findMany({ where: { deletedAt: null } });
    expect(remaining).toHaveLength(0);
  });

  it('bulkDelete gagal total (rollback) jika salah satu masih punya semester aktif', async () => {
    const a = await academicyearService.create({ startYear: 2024 } as any);
    const b = await academicyearService.create({ startYear: 2025 } as any);
    await prisma.semester.create({ data: { type: 'Ganjil', academicYearId: b.id } });

    await expect(academicyearService.bulkDelete([a.id, b.id])).rejects.toThrow(
      'Cannot delete Academic Year because it still has active Semesters.'
    );

    // rollback: `a` seharusnya TIDAK ikut terhapus meski lolos pengecekan awal
    const aReloaded = await prisma.academicYear.findUnique({ where: { id: a.id } });
    expect(aReloaded?.deletedAt).toBeNull();
  });
});
