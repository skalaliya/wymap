type LogLevel = "debug" | "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const minLevel: LogLevel =
  process.env.NODE_ENV === "production" ? "info" : "debug";

const shouldLog = (level: LogLevel) =>
  levelOrder[level] >= levelOrder[minLevel];

const baseLog = (level: LogLevel, message: string, meta?: LogMeta) => {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    level,
    message,
    time: new Date().toISOString(),
    ...meta,
  };

  const output = JSON.stringify(payload);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    default:
      console.log(output);
  }
};

export const logger = {
  debug: (message: string, meta?: LogMeta) => baseLog("debug", message, meta),
  info: (message: string, meta?: LogMeta) => baseLog("info", message, meta),
  warn: (message: string, meta?: LogMeta) => baseLog("warn", message, meta),
  error: (message: string, meta?: LogMeta) => baseLog("error", message, meta),
};
