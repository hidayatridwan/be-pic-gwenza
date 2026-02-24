import rabbitmqConnection from '../../apps/rabbitmq.js';
import dotenv from 'dotenv';

dotenv.config();

class QueueSetup {
    constructor() {
        this.exchange = process.env.RABBITMQ_EXCHANGE;
        this.exchangeType = process.env.RABBITMQ_EXCHANGE_TYPE;
    }

    /**
     * Setup complete queue system dengan retry mechanism
     * @param {string} queueName - Nama queue utama
     * @param {string} routingKey - Routing key untuk queue
     */
    async setupQueueWithRetry(queueName, routingKey) {
        try {
            const channel = await rabbitmqConnection.getChannel();

            // 1. Declare exchange utama
            await channel.assertExchange(this.exchange, this.exchangeType, {
                durable: true,
            });

            // 2. Setup DLQ untuk retry pertama (TTL 5 menit)
            const dlq1Name = `${queueName}.dlq.retry1`;
            await channel.assertQueue(dlq1Name, {
                durable: true,
                arguments: {
                    'x-queue-type': 'quorum',
                    'x-message-ttl': 5 * 60 * 1000, // 5 menit
                    'x-dead-letter-exchange': this.exchange,
                    'x-dead-letter-routing-key': routingKey, // Kembali ke queue utama
                },
            });

            // 3. Setup DLQ untuk retry kedua (TTL 10 menit)
            const dlq2Name = `${queueName}.dlq.retry2`;
            await channel.assertQueue(dlq2Name, {
                durable: true,
                arguments: {
                    'x-queue-type': 'quorum',
                    'x-message-ttl': 10 * 60 * 1000, // 10 menit
                    'x-dead-letter-exchange': this.exchange,
                    'x-dead-letter-routing-key': routingKey, // Kembali ke queue utama
                },
            });

            // 4. Setup queue untuk permanent failure
            const permanentFailQueue = `${queueName}.failed.permanent`;
            await channel.assertQueue(permanentFailQueue, {
                durable: true,
                arguments: {
                    'x-queue-type': 'quorum'
                }
            });

            // 5. Setup queue utama dengan DLX ke retry pertama
            await channel.assertQueue(queueName, {
                durable: true,
                arguments: {
                    'x-queue-type': 'quorum',
                    'x-dead-letter-exchange': this.exchange,
                    'x-dead-letter-routing-key': `${routingKey}.dlq.retry1`,
                },
            });

            // 6. Bind queue utama ke exchange
            await channel.bindQueue(queueName, this.exchange, routingKey);

            // 7. Bind DLQ retry1 ke exchange
            await channel.bindQueue(dlq1Name, this.exchange, `${routingKey}.dlq.retry1`);

            // 8. Bind DLQ retry2 ke exchange
            await channel.bindQueue(dlq2Name, this.exchange, `${routingKey}.dlq.retry2`);

            console.log(`✅ Queue system berhasil di-setup:`);
            console.log(`   - Main Queue: ${queueName}`);
            console.log(`   - DLQ Retry 1 (5 min): ${dlq1Name}`);
            console.log(`   - DLQ Retry 2 (10 min): ${dlq2Name}`);
            console.log(`   - Permanent Fail: ${permanentFailQueue}`);

            return {
                mainQueue: queueName,
                dlqRetry1: dlq1Name,
                dlqRetry2: dlq2Name,
                permanentFailQueue,
            };
        } catch (error) {
            console.error('❌ Error saat setup queue:', error);
            throw error;
        }
    }

    /**
     * Setup semua queue dari .env
     */
    async setupAllQueues() {
        try {
            // Setup upload order queue
            await this.setupQueueWithRetry(
                process.env.UPLOAD_ORDER_QUEUE,
                process.env.UPLOAD_ORDER_CREATED
            );

            // Setup upload cancel queue
            await this.setupQueueWithRetry(
                process.env.UPLOAD_CANCEL_QUEUE,
                process.env.UPLOAD_CANCEL_CREATED
            );

            // Setup process order queue
            await this.setupQueueWithRetry(
                process.env.PROCESS_ORDER_QUEUE,
                process.env.PROCESS_ORDER_REQUESTED
            );

            // Setup process cancel queue
            await this.setupQueueWithRetry(
                process.env.PROCESS_CANCEL_QUEUE,
                process.env.PROCESS_CANCEL_REQUESTED
            );

            console.log('✅ Semua queue berhasil di-setup');
        } catch (error) {
            console.error('❌ Error saat setup semua queue:', error);
            throw error;
        }
    }
}

export default new QueueSetup();