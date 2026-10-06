import { describe, expect, it } from 'vitest';
import { customErrorMap } from '../../src/app/utils/zod-error-map.ts';

// customErrorMap dites langsung (bukan lewat schema.safeParse) karena saat
// ini belum ada pemanggilan z.config()/setErrorMap() di manapun di codebase
// yang menghubungkannya ke pipeline validasi zod secara global — fungsi ini
// murni memformat { issue, ctx } -> pesan Indonesia, jadi itulah yang dites.
const ctx = { defaultError: 'default message' };

describe('customErrorMap', () => {
  it('memberi pesan "Wajib diisi" saat input undefined (field required)', () => {
    const result = customErrorMap({ code: 'invalid_type', expected: 'string', input: undefined } as any, ctx);
    expect(result.message).toBe('Wajib diisi');
  });

  it('memberi pesan tipe data salah dengan tipe yang diterima & diterima disebutkan', () => {
    const result = customErrorMap({ code: 'invalid_type', expected: 'string', input: 20 } as any, ctx);
    expect(result.message).toBe('Tipe data tidak valid. Diharapkan string, tetapi menerima number');
  });

  it('memberi pesan kunci tidak dikenali untuk unrecognized_keys', () => {
    const result = customErrorMap({ code: 'unrecognized_keys', keys: ['foo', 'bar'] } as any, ctx);
    expect(result.message).toBe('Kunci tidak dikenali pada objek: foo, bar');
  });

  it('memberi pesan minimal karakter untuk string terlalu pendek', () => {
    const result = customErrorMap({ code: 'too_small', origin: 'string', minimum: 5 } as any, ctx);
    expect(result.message).toBe('Harus terdiri dari minimal 5 karakter');
  });

  it('memberi pesan minimal elemen untuk array terlalu pendek', () => {
    const result = customErrorMap({ code: 'too_small', origin: 'array', minimum: 2 } as any, ctx);
    expect(result.message).toBe('Harus berisi minimal 2 elemen');
  });

  it('memberi pesan maksimal untuk number terlalu besar', () => {
    const result = customErrorMap({ code: 'too_big', origin: 'number', maximum: 100 } as any, ctx);
    expect(result.message).toBe('Harus kurang dari atau sama dengan 100');
  });

  it('memberi pesan kelipatan untuk not_multiple_of', () => {
    const result = customErrorMap({ code: 'not_multiple_of', divisor: 5 } as any, ctx);
    expect(result.message).toBe('Harus merupakan kelipatan dari 5');
  });

  it('jatuh ke defaultError milik zod untuk issue code yang tidak ditangani khusus', () => {
    const result = customErrorMap({ code: 'custom' } as any, ctx);
    expect(result.message).toBe('default message');
  });
});
