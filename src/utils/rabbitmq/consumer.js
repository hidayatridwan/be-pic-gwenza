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
     * Get retry count dari message headers
     * @param {object} msg - RabbitMQ message
     */
    getRetryCount(msg) {
        // Cek custom header dulu
        if (msg.properties.headers && msg.properties.headers['x-retry-count']) {
            return msg.properties.headers['x-retry-count'];
        }

        // Cek x-death headers (otomatis dari RabbitMQ)
        if (msg.properties.headers && msg.properties.headers['x-death']) {
            const deaths = msg.properties.headers['x-death'];
            return deaths[0]?.count || 0;
        }

        return 0;
    }

    /**
     * Determine DLQ routing key berdasarkan retry count
     * @param {string} originalRoutingKey - Routing key asli
     * @param {number} retryCount - Jumlah retry
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
     * Handle message failure dengan retry logic
     * @param {object} channel - RabbitMQ channel
     * @param {object} msg - Message yang gagal
     * @param {string} queueName - Nama queue asli
     * @param {string} routingKey - Routing key asli
     * @param {Error} error - Error yang terjadi
     */
    async handleFailure(channel, msg, queueName, routingKey, error) {
        try {
            const retryCount = this.getRetryCount(msg);
            console.log(`❌ Message gagal diproses (Retry ke-${retryCount})`);
            console.log(`   Error: ${error.message}`);

            // Tentukan kemana message akan di-route
            const dlqRoutingKey = this.getDLQRoutingKey(routingKey, retryCount);

            if (dlqRoutingKey) {
                // Masih ada kesempatan retry
                console.log(`♻️  Routing message ke DLQ: ${dlqRoutingKey}`);

                // Republish ke DLQ dengan retry count di-update
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

                // ACK message asli (sudah di-handle)
                channel.ack(msg);
            } else {
                // Sudah retry 2x, masukkan ke permanent fail queue
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

                // ACK message asli
                channel.ack(msg);
            }
        } catch (err) {
            console.error('❌ Error saat handle failure:', err);
            // NACK dengan requeue false untuk hindari infinite loop
            channel.nack(msg, false, false);
        }
    }

    /**
     * Consume message dari queue dengan retry handling
     * @param {string} queueName - Nama queue
     * @param {string} routingKey - Routing key untuk retry
     * @param {Function} handler - Function untuk process message
     * @param {object} options - Consumer options
     */
    async consume(queueName, routingKey, handler, options = {}) {
        try {
            const channel = await rabbitmqConnection.getChannel();

            // Set prefetch untuk load balancing
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

                        // Process message menggunakan handler yang diberikan
                        await handler(messageData, msg);

                        // Jika berhasil, ACK message
                        channel.ack(msg);
                        console.log('✅ Message berhasil diproses');
                    } catch (error) {
                        // Jika gagal, handle dengan retry logic
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
     * Stop consumer tertentu
     * @param {string} queueName - Nama queue
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
     * Stop semua consumer
     */
    async stopAllConsumers() {
        for (const queueName of this.consumers.keys()) {
            await this.stopConsumer(queueName);
        }
    }

}

export default new RabbitMQConsumer();