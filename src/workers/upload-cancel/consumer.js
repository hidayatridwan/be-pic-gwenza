import consumer from "../../utils/rabbitmq/consumer.js";
import { handleUploadOrder } from "./handler.js";

const {
    UPLOAD_CANCEL_QUEUE,
    UPLOAD_CANCEL_CREATED,
} = process.env;

async function startConsumer() {
    try {
        console.log(`🚀 Starting ${UPLOAD_CANCEL_QUEUE} consumer...`);

        await consumer.consume(
            UPLOAD_CANCEL_QUEUE,
            UPLOAD_CANCEL_CREATED,
            handleUploadOrder
        );

        console.log(`✅ ${UPLOAD_CANCEL_QUEUE} consumer started`);

        const gracefulShutdown = async (signal) => {
            console.log(`\n${signal} received, shutting down consumer...`);
            await consumer.stopConsumer(UPLOAD_CANCEL_QUEUE);
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
