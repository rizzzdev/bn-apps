export const customErrorMap = (issue: Record<string, unknown>): { message: string } | string | undefined | null => {
  let message = typeof issue.message === 'string' ? issue.message : '';

  if (issue.code === 'invalid_type') {
    if (issue.received === 'undefined') {
      message = 'Wajib diisi';
    } else {
      message = `Diharapkan tipe ${String(issue.expected)}, diterima ${String(issue.received)}`;
    }
  } else if (issue.code === 'invalid_string') {
    if (issue.validation === 'email') {
      message = 'Format email tidak valid';
    } else if (issue.validation === 'url') {
      message = 'Format URL tidak valid';
    }
  } else if (issue.code === 'too_small') {
    if (issue.type === 'string') {
      message = `Harus terdiri dari minimal ${String(issue.minimum)} karakter`;
    } else if (issue.type === 'array') {
      message = `Harus memilih minimal ${String(issue.minimum)} item`;
    }
  } else if (issue.code === 'too_big') {
    if (issue.type === 'string') {
      message = `Tidak boleh lebih dari ${String(issue.maximum)} karakter`;
    }
  }

  return { message };
};
