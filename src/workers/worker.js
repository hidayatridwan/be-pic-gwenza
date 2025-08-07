import { logger } from "../apps/logging.js";
import { uploadDeliveryWorker, uploadWorker } from "./upload.worker.js";
import { orderWorker } from "./order.worker.js";
import dotenv from "dotenv";

dotenv.config();
uploadWorker().catch((err) => logger.error(err));
uploadDeliveryWorker().catch((err) => logger.error(err));
orderWorker().catch((err) => logger.error(err));
