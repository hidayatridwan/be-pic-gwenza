import { logger } from "../apps/logging.js";
import { uploadWorker } from "./upload.worker.js";
import { orderWorker } from "./order.worker.js";
import dotenv from "dotenv";

dotenv.config();
uploadWorker().catch((err) => logger.error(err));
// uploadDeliveryWorker().catch((err) => logger.error(err));
// uploadCancelWorker().catch((err) => logger.error(err));
orderWorker().catch((err) => logger.error(err));
