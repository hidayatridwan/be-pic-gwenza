import { logger } from "../apps/logging.js";
import dotenv from "dotenv";
import { syncWorker } from "./sync.worker.js";

dotenv.config();

syncWorker().catch((err) => logger.error(err));
