import { getChannel } from "../apps/rabbitmq.js";
import dotenv from "dotenv";

dotenv.config();

const retry = async (queue) => {
    let channel;
    try {
        // 1. Connect to RabbitMQ
        channel = await getChannel();

        // 2. Define queues
        const DLQ = `${queue}.dlq`;
        const MAIN_Q = queue;

        // 3. Assert queues (ensure they exist)
        await channel.assertQueue(DLQ, { durable: true });
        await channel.assertQueue(MAIN_Q, { durable: true });

        // 4. Consume messages from DLQ
        channel.consume(DLQ, (msg) => {
            if (msg !== null) {
                console.log('Retrying message...');

                // Parse the message content
                const payload = JSON.parse(msg.content.toString());

                const messages = Object.values(payload)
                    .filter(item => Array.isArray(item));

                // 5. Re-publish to main queue
                channel.sendToQueue(MAIN_Q, Buffer.from(JSON.stringify(messages)), { persistent: true });

                // 6. Acknowledge (remove from DLQ)
                channel.ack(msg);
            }
        });

        console.log('DLQ retry worker started. Listening for messages...');
    } catch (error) {
        console.error('Error in retry worker:', error);
        process.exit(1);
    }
}

retry(process.env.PROCESS_ORDER_QUEUE);
retry(process.env.PROCESS_CANCEL_QUEUE);