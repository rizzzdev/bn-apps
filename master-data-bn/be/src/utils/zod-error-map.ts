import { z, ZodErrorMap, ZodIssueCode, ZodParsedType } from 'zod';

export const customErrorMap: ZodErrorMap = (issue, ctx) => {
  let message: string;

  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = 'Wajib diisi';
      } else {
        message = `Tipe data tidak valid. Diharapkan ${issue.expected}, tetapi menerima ${issue.received}`;
      }
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Kunci tidak dikenali pada objek: ${issue.keys.join(', ')}`;
      break;
    case ZodIssueCode.invalid_union:
      message = 'Input tidak valid';
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Nilai diskriminator tidak valid. Diharapkan salah satu dari: ${issue.options.join(', ')}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Nilai enum tidak valid. Diharapkan salah satu dari: ${issue.options.join(', ')}`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = 'Argumen fungsi tidak valid';
      break;
    case ZodIssueCode.invalid_return_type:
      message = 'Tipe kembalian fungsi tidak valid';
      break;
    case ZodIssueCode.invalid_date:
      message = 'Format tanggal tidak valid';
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === 'object') {
        if ('startsWith' in issue.validation) {
          message = `Harus diawali dengan "${issue.validation.startsWith}"`;
        } else if ('endsWith' in issue.validation) {
          message = `Harus diakhiri dengan "${issue.validation.endsWith}"`;
        } else {
          message = 'Format string tidak valid';
        }
      } else if (issue.validation === 'email') {
        message = 'Format email tidak valid';
      } else if (issue.validation === 'url') {
        message = 'Format URL tidak valid';
      } else if (issue.validation === 'uuid') {
        message = 'Format UUID tidak valid';
      } else if (issue.validation === 'regex') {
        message = 'Format tidak sesuai (regex)';
      } else {
        message = 'Format string tidak valid';
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === 'array')
        message = `Harus berisi minimal ${issue.minimum} elemen`;
      else if (issue.type === 'string')
        message = `Harus terdiri dari minimal ${issue.minimum} karakter`;
      else if (issue.type === 'number')
        message = `Harus lebih besar atau sama dengan ${issue.minimum}`;
      else if (issue.type === 'date')
        message = `Tanggal harus setelah atau sama dengan ${new Date(Number(issue.minimum)).toISOString()}`;
      else
        message = 'Nilai terlalu kecil';
      break;
    case ZodIssueCode.too_big:
      if (issue.type === 'array')
        message = `Harus berisi maksimal ${issue.maximum} elemen`;
      else if (issue.type === 'string')
        message = `Harus terdiri dari maksimal ${issue.maximum} karakter`;
      else if (issue.type === 'number')
        message = `Harus kurang dari atau sama dengan ${issue.maximum}`;
      else if (issue.type === 'date')
        message = `Tanggal harus sebelum atau sama dengan ${new Date(Number(issue.maximum)).toISOString()}`;
      else
        message = 'Nilai terlalu besar';
      break;
    case ZodIssueCode.custom:
      message = `Validasi gagal`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = 'Tipe persilangan tidak valid';
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Harus merupakan kelipatan dari ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = 'Angka harus terhingga (finite)';
      break;
    default:
      message = ctx.defaultError;
  }

  return { message };
};
