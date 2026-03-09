import rabbitmqConnection from '../../apps/rabbitmq.js';
import { truncate } from '../format.js';
import dotenv from 'dotenv';

dotenv.config();

class RabbitMQConsumer {
    constructor() {
        this.exchange = process.env.RABBITMQ_EXCHANGE;
        this.consumers = new Map(); // Track active consumers
    }

    /**
     * Get retry count from message headers
     * @param {object} msg - RabbitMQ message
     */
    getRetryCount(msg) {
        // Check custom header first
        if (msg.properties.headers && msg.properties.headers['x-retry-count']) {
            return msg.properties.headers['x-retry-count'];
        }

        // Check x-death headers (automatically added by RabbitMQ)
        if (msg.properties.headers && msg.properties.headers['x-death']) {
            const deaths = msg.properties.headers['x-death'];
            return deaths[0]?.count || 0;
        }

        return 0;
    }

    /**
     * Determine DLQ routing key based on retry count
     * @param {string} originalRoutingKey - Original routing key
     * @param {number} retryCount - Retry count
     */
    getDLQRoutingKey(originalRoutingKey, retryCount) {
        if (retryCount === 0) {
            return `${originalRoutingKey}.dlq.retry1`; // First failure -> retry 1 (5 min)
        } else if (retryCount === 1) {
            return `${originalRoutingKey}.dlq.retry2`; // Second failure -> retry 2 (10 min)
        } else {
            return null; // Will go to permanent fail queue
        }
    }

    /**
     * Handle message failure with retry logic
     * @param {object} channel - RabbitMQ channel
     * @param {object} msg - Failed message
     * @param {string} queueName - Original queue name
     * @param {string} routingKey - Original routing key
     * @param {Error} error - Occurred error
     */
    async handleFailure(channel, msg, queueName, routingKey, error) {
        try {
            const retryCount = this.getRetryCount(msg);
            console.log(`❌ Message gagal diproses (Retry ke-${retryCount})`);
            console.log(`   Error: ${error.message}`);

            // Determine where the message should be routed
            const dlqRoutingKey = this.getDLQRoutingKey(routingKey, retryCount);

            if (dlqRoutingKey) {
                // Retry is still available
                console.log(`♻️  Routing message ke DLQ: ${dlqRoutingKey}`);

                // Republish to DLQ with updated retry count
                const messageData = JSON.parse(msg.content.toString());
                const republishOptions = {
                    persistent: true,
                    contentType: 'application/json',
                    timestamp: Date.now(),
                    headers: {
                        'x-retry-count': retryCount + 1,
                        'x-original-queue': queueName,
                        'x-failure-reason': error.message,
                        'x-failed-at': new Date().toISOString(),
                    },
                };

                channel.publish(
                    this.exchange,
                    dlqRoutingKey,
                    msg.content,
                    republishOptions
                );

                // ACK original message (already handled)
                channel.ack(msg);
            } else {
                // Already retried twice, send to permanent fail queue
                const permanentFailQueue = `${queueName}.failed.permanent`;
                console.log(`💀 Permanent failure - routing ke: ${permanentFailQueue}`);

                const messageData = JSON.parse(msg.content.toString());
                const failureData = {
                    ...messageData,
                    failureInfo: {
                        originalQueue: queueName,
                        retryCount: retryCount,
                        lastError: error.message,
                        failedAt: new Date().toISOString(),
                        requiresManualIntervention: true,
                    },
                };

                await channel.sendToQueue(
                    permanentFailQueue,
                    Buffer.from(JSON.stringify(failureData)),
                    {
                        persistent: true,
                        contentType: 'application/json',
                    }
                );

                // ACK original message
                channel.ack(msg);
            }
        } catch (err) {
            console.error('❌ Error saat handle failure:', err);
            // NACK with requeue false to avoid infinite loop
            channel.nack(msg, false, false);
        }
    }

    /**
     * Consume messages from a queue with retry handling
     * @param {string} queueName - Queue name
     * @param {string} routingKey - Routing key for retries
     * @param {Function} handler - Function to process messages
     * @param {object} options - Consumer options
     */
    async consume(queueName, routingKey, handler, options = {}) {
        try {
            const channel = await rabbitmqConnection.getChannel();

            // Set prefetch for load balancing
            await channel.prefetch(options.prefetch || 1);

            console.log(`🎧 Listening pada queue: ${queueName}`);

            const consumer = await channel.consume(
                queueName,
                async (msg) => {
                    if (!msg) {
                        console.log('Consumer dibatalkan oleh server');
                        return;
                    }

                    try {
                        const retryCount = this.getRetryCount(msg);
                        const messageData = JSON.parse(msg.content.toString());

                        console.log(`\n📥 Menerima message dari ${queueName} (Retry: ${retryCount})`);
                        console.log('   Data:', truncate(JSON.stringify(messageData, null, 2)));

                        // Process message using the provided handler
                        await handler(messageData, msg);

                        // ACK message on success
                        channel.ack(msg);
                        console.log('✅ Message berhasil diproses');
                    } catch (error) {
                        // Handle failure using retry logic
                        await this.handleFailure(channel, msg, queueName, routingKey, error);
                    }
                },
                {
                    noAck: false, // Manual acknowledgment
                    ...options,
                }
            );

            this.consumers.set(queueName, consumer);
            console.log(`✅ Consumer untuk ${queueName} aktif`);

            return consumer;
        } catch (error) {
            console.error(`❌ Error saat consume dari ${queueName}:`, error);
            throw error;
        }
    }

    /**
     * Stop a specific consumer
     * @param {string} queueName - Queue name
     */
    async stopConsumer(queueName) {
        try {
            const consumer = this.consumers.get(queueName);
            if (consumer) {
                const channel = await rabbitmqConnection.getChannel();
                await channel.cancel(consumer.consumerTag);
                this.consumers.delete(queueName);
                console.log(`🛑 Consumer untuk ${queueName} dihentikan`);
            }
        } catch (error) {
            console.error(`❌ Error saat stop consumer ${queueName}:`, error);
        }
    }

    /**
     * Stop all consumers
     */
    async stopAllConsumers() {
        for (const queueName of this.consumers.keys()) {
            await this.stopConsumer(queueName);
        }
    }

}

export default new RabbitMQConsumer();