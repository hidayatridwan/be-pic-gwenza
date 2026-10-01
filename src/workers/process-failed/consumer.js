import consumer from "../../utils/rabbitmq/consumer.js";
import { handleFailedOrder } from "./handler.js";

const {
    PROCESS_FAILED_QUEUE,
    PROCESS_FAILED_REQUESTED,
} = process.env;

async function startConsumer() {
    try {
        console.log(`🚀 Starting ${PROCESS_FAILED_QUEUE} consumer...`);

        await consumer.consume(
            PROCESS_FAILED_QUEUE,
            PROCESS_FAILED_REQUESTED,
            handleFailedOrder
        );

        console.log(`✅ ${PROCESS_FAILED_QUEUE} consumer started`);

        const gracefulShutdown = async (signal) => {
            console.log(`\n${signal} received, shutting down consumer...`);
            await consumer.stopConsumer(PROCESS_FAILED_QUEUE);
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
