import consumer from "../../utils/rabbitmq/consumer.js";
import { handleCancelOrder } from "./handler.js";

const {
    PROCESS_CANCEL_QUEUE,
    PROCESS_CANCEL_CREATED,
} = process.env;

async function startConsumer() {
    try {
        console.log(`🚀 Starting ${PROCESS_CANCEL_QUEUE} consumer...`);

        await consumer.consume(
            PROCESS_CANCEL_QUEUE,
            PROCESS_CANCEL_CREATED,
            handleCancelOrder
        );

        console.log(`✅ ${PROCESS_CANCEL_QUEUE} consumer started`);

        const gracefulShutdown = async (signal) => {
            console.log(`\n${signal} received, shutting down consumer...`);
            await consumer.stopConsumer(PROCESS_CANCEL_QUEUE);
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
