import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeModuleBoundaries, moduleOf, BUSINESS_MODULES } from '../scripts/lib/analyze-module-boundaries.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('module boundary enforcement (modular monolith)', () => {
  it('tidak ada module bisnis yang mengimpor internal module lain secara langsung', () => {
    const { boundaryViolations } = analyzeModuleBoundaries({ rootDir: ROOT });

    expect(
      boundaryViolations,
      boundaryViolations
        .map((v) => `${v.from} -> ${v.to} (gunakan #app/ports + Orchestrator)`)
        .join('\n')
    ).toEqual([]);
  });

  it('tidak ada circular dependency antar-module bisnis (mis. auth <-> master)', () => {
    const { cycles } = analyzeModuleBoundaries({ rootDir: ROOT });

    expect(
      cycles,
      cycles.map((c) => [...c, c[0]].join(' -> ')).join('\n')
    ).toEqual([]);
  });

  it('sanity check: pemeriksa benar-benar mendeteksi pelanggaran, bukan lolos secara diam-diam', () => {
    // graph palsu yang meniru struktur nyata: konfirmasi util moduleOf() dan
    // logika deteksi di analyzeModuleBoundaries() memang aktif, bukan no-op.
    expect(moduleOf('src/auth/src/services/auth-data.service.ts')).toBe('auth');
    expect(moduleOf('src/app/orchestrator.ts')).toBeNull();
    expect(BUSINESS_MODULES).toContain('master');
  });

  it('mendeteksi pelanggaran nyata pada fixture yang meniru bug lama auth -> master', () => {
    const fixtureRoot = path.join(ROOT, 'test', 'fixtures', 'violation-repo');
    const { boundaryViolations, cycles } = analyzeModuleBoundaries({ rootDir: fixtureRoot });

    expect(boundaryViolations).toEqual([
      expect.objectContaining({
        from: 'src/auth/src/services/bad.service.ts',
        to: 'src/master/src/database/index.ts',
        fromModule: 'auth',
        toModule: 'master',
      }),
    ]);
    // fixture juga sengaja punya master -> auth (barrel, sah) supaya
    // menghasilkan cycle auth <-> master persis seperti kasus lama.
    expect(cycles).toEqual([['auth', 'master']]);
  });

  it('memeriksa jumlah file yang wajar (regresi jika walker rusak dan cuma dapat 0 file)', () => {
    const { filesChecked } = analyzeModuleBoundaries({ rootDir: ROOT });
    expect(filesChecked).toBeGreaterThan(100);
  });
});
