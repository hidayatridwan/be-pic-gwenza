import { logger } from "../apps/logging.js";
import { uploadOrderWorker, uploadCancelWorker } from "./upload.worker.js";
import dotenv from "dotenv";

dotenv.config();

uploadOrderWorker().catch((err) => logger.error(err));
uploadCancelWorker().catch((err) => logger.error(err));