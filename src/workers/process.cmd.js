import { logger } from "../apps/logging.js";
import { cancelWorker, orderWorker } from "./order.worker.js";
import dotenv from "dotenv";

dotenv.config();

orderWorker().catch((err) => logger.error(err));
cancelWorker().catch((err) => logger.error(err));