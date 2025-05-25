import { PrismaClient } from "../generated/prisma/index.js";
import { logger } from "./logging.js";

export const prismaClient = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "info" },
    { emit: "event", level: "warn" },
    { emit: "event", level: "error" },
  ],
});

prismaClient.$on("query", (e) => {
  logger.info(e.query);
});

prismaClient.$on("info", (e) => {
  logger.info(e);
});

prismaClient.$on("warn", (e) => {
  logger.warn(e);
});

prismaClient.$on("error", (e) => {
  logger.error(e);
});
