import consumer from "../../utils/rabbitmq/consumer.js";
import { handleUploadOrder } from "./handler.js";

const {
    UPLOAD_FAILED_QUEUE,
    UPLOAD_FAILED_CREATED,
} = process.env;

async function startConsumer() {
    try {
        console.log(`🚀 Starting ${UPLOAD_FAILED_QUEUE} consumer...`);

        await consumer.consume(
            UPLOAD_FAILED_QUEUE,
            UPLOAD_FAILED_CREATED,
            handleUploadOrder
        );

        console.log(`✅ ${UPLOAD_FAILED_QUEUE} consumer started`);

        const gracefulShutdown = async (signal) => {
            console.log(`\n${signal} received, shutting down consumer...`);
            await consumer.stopConsumer(UPLOAD_FAILED_QUEUE);
            process.exit(0);
        };

        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    } catch (err) {
        console.error("❌ Failed to start consumer:", err);
        process.exit(1);
    }
}

startConsumer();
