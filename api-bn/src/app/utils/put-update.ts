export function putOptionalToNull<T extends Record<string, unknown>>(
  data: T,
  nullableFields: readonly string[],
): T {
  const result: Record<string, unknown> = { ...data };
  for (const field of nullableFields) {
    const value = result[field];
    if (value === undefined || value === null || value === '') {
      result[field] = null;
    }
  }
  return result as T;
}
