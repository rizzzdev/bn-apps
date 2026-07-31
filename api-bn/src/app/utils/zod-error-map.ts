import type { z } from 'zod';

export const customErrorMap = (issue: z.ZodIssue, ctx: { defaultError: string }): { message: string } => {
  let message: string;

  switch (issue.code) {
    case 'invalid_type':
      if (issue.input === undefined) {
        message = 'Wajib diisi';
      } else {
        message = `Tipe data tidak valid. Diharapkan ${issue.expected}, tetapi menerima ${typeof issue.input}`;
      }
      break;
    case 'unrecognized_keys':
      message = `Kunci tidak dikenali pada objek: ${issue.keys.join(', ')}`;
      break;
    case 'invalid_union':
      message = 'Input tidak valid';
      break;
    case 'too_small':
      if (issue.origin === 'array')
        message = `Harus berisi minimal ${issue.minimum} elemen`;
      else if (issue.origin === 'string')
        message = `Harus terdiri dari minimal ${issue.minimum} karakter`;
      else if (issue.origin === 'number')
        message = `Harus lebih besar atau sama dengan ${issue.minimum}`;
      else if (issue.origin === 'date')
        message = `Tanggal harus setelah atau sama dengan ${new Date(Number(issue.minimum)).toISOString()}`;
      else
        message = 'Nilai terlalu kecil';
      break;
    case 'too_big':
      if (issue.origin === 'array')
        message = `Harus berisi maksimal ${issue.maximum} elemen`;
      else if (issue.origin === 'string')
        message = `Harus terdiri dari maksimal ${issue.maximum} karakter`;
      else if (issue.origin === 'number')
        message = `Harus kurang dari atau sama dengan ${issue.maximum}`;
      else if (issue.origin === 'date')
        message = `Tanggal harus sebelum atau sama dengan ${new Date(Number(issue.maximum)).toISOString()}`;
      else
        message = 'Nilai terlalu besar';
      break;
    case 'not_multiple_of':
      message = `Harus merupakan kelipatan dari ${issue.divisor}`;
      break;
    default:
      message = ctx.defaultError;
  }

  return { message };
};
