export const logger = {
  info: (event: string, data: Record<string, any>) => {
    console.log(JSON.stringify({
      level: "info",
      event,
      ...data,
      timestamp: new Date().toISOString()
    }));
  },
  warn: (event: string, data: Record<string, any>) => {
    console.warn(JSON.stringify({
      level: "warn",
      event,
      ...data,
      timestamp: new Date().toISOString()
    }));
  },
  error: (event: string, data: Record<string, any>) => {
    console.error(JSON.stringify({
      level: "error",
      event,
      ...data,
      timestamp: new Date().toISOString()
    }));
  }
};
