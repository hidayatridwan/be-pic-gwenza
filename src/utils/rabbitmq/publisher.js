import rabbitmqConnection from '../../apps/rabbitmq.js';
import dotenv from 'dotenv';
import { truncate } from '../format.js';

dotenv.config();

class RabbitMQPublisher {
    constructor() {
        this.exchange = process.env.RABBITMQ_EXCHANGE;
    }

    /**
     * Publish message ke RabbitMQ
     * @param {string} routingKey - Routing key untuk message
     * @param {object} message - Data yang akan dikirim
     * @param {object} options - Optional settings (priority, expiration, dll)
     */
    async publish(routingKey, message, options = {}) {
        try {
            const channel = await rabbitmqConnection.getChannel();

            const messageBuffer = Buffer.from(JSON.stringify(message));

            const publishOptions = {
                persistent: true, // Message akan di-persist ke disk
                contentType: 'application/json',
                timestamp: Date.now(),
                ...options,
            };

            const published = channel.publish(
                this.exchange,
                routingKey,
                messageBuffer,
                publishOptions
            );

            if (published) {
                console.log(`📤 Message berhasil dipublish ke ${routingKey}`);
                console.log('   Data:', truncate(JSON.stringify(message, null, 2)));
                return true;
            } else {
                console.error('❌ Gagal publish message - channel buffer penuh');
                return false;
            }
        } catch (error) {
            console.error('❌ Error saat publish message:', error);
            throw error;
        }
    }

    /**
     * Publish message ke DLQ tertentu
     * @param {string} routingKey - Routing key DLQ
     * @param {object} message - Message yang akan dikirim
     * @param {number} retryCount - Jumlah retry yang sudah dilakukan
     */
    async publishToDLQ(routingKey, message, retryCount) {
        return this.publish(routingKey, message, {
            headers: {
                'x-retry-count': retryCount,
                'x-first-death-queue': message.originalQueue || 'unknown',
                'x-first-death-reason': message.failureReason || 'unknown',
            },
        });
    }
}

export default new RabbitMQPublisher();