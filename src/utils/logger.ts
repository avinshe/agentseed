import pc from "picocolors";

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

let currentLevel: LogLevel = "info";

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[currentLevel];
}

export const logger = {
  debug(...args: unknown[]): void {
    if (shouldLog("debug")) {
      console.log(pc.gray("[debug]"), ...args);
    }
  },

  info(...args: unknown[]): void {
    if (shouldLog("info")) {
      console.log(...args);
    }
  },

  success(...args: unknown[]): void {
    if (shouldLog("info")) {
      console.log(pc.green("✔"), ...args);
    }
  },

  warn(...args: unknown[]): void {
    if (shouldLog("warn")) {
      console.warn(pc.yellow("⚠"), ...args);
    }
  },

  error(...args: unknown[]): void {
    if (shouldLog("error")) {
      console.error(pc.red("✖"), ...args);
    }
  },
};
