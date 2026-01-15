/**
 * Logger utility for production-safe logging
 * Only logs in development mode to avoid console spam in production
 */

const isDev = __DEV__;

export const logger = {
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  info: (...args) => {
    if (isDev) {
      console.info(...args);
    }
  },

  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  error: (...args) => {
    // Always log errors, even in production
    console.error(...args);
  },

  debug: (...args) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};

export default logger;
