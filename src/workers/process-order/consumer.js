import consumer from "../../utils/rabbitmq/consumer.js";
import { handleProcessOrder } from "./handler.js";

const {
    PROCESS_ORDER_QUEUE,
    PROCESS_ORDER_CREATED,
} = process.env;

async function startConsumer() {
    try {
        console.log(`🚀 Starting ${PROCESS_ORDER_QUEUE} consumer...`);

        await consumer.consume(
            PROCESS_ORDER_QUEUE,
            PROCESS_ORDER_CREATED,
            handleProcessOrder
        );

        console.log(`✅ ${PROCESS_ORDER_QUEUE} consumer started`);

        const gracefulShutdown = async (signal) => {
            console.log(`\n${signal} received, shutting down consumer...`);
            await consumer.stopConsumer(PROCESS_ORDER_QUEUE);
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
