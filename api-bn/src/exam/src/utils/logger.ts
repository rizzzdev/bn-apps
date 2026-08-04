type LogLevel = "info" | "warn" | "error";

const write = (level: LogLevel, obj: unknown, msg?: string): void => {
  const label = `[${new Date().toISOString()}] ${level.toUpperCase()}`;
  const message = msg ?? (typeof obj === "string" ? obj : JSON.stringify(obj));
  if (msg !== undefined) {
    console[level](label, message, obj);
  } else {
    console[level](label, message);
  }
};

export const logger = {
  info: (obj: unknown, msg?: string): void => write("info", obj, msg),
  warn: (obj: unknown, msg?: string): void => write("warn", obj, msg),
  error: (obj: unknown, msg?: string): void => write("error", obj, msg),
};
