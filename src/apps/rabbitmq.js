import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

class RabbitMQConnection {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            if (this.isConnected) {
                console.log('RabbitMQ sudah terkoneksi');
                return this.channel;
            }

            console.log('Menghubungkan ke RabbitMQ...');
            this.connection = await amqp.connect(process.env.RABBITMQ_URL);
            this.channel = await this.connection.createChannel();
            this.isConnected = true;

            // Handle connection errors
            this.connection.on('error', (err) => {
                console.error('RabbitMQ connection error:', err);
                this.isConnected = false;
            });

            this.connection.on('close', () => {
                console.log('RabbitMQ connection closed');
                this.isConnected = false;
                // Auto reconnect setelah 5 detik
                setTimeout(() => this.connect(), 5000);
            });

            console.log('✅ RabbitMQ berhasil terkoneksi');
            return this.channel;
        } catch (error) {
            console.error('❌ Gagal connect ke RabbitMQ:', error.message);
            this.isConnected = false;
            // Retry connection setelah 5 detik
            setTimeout(() => this.connect(), 5000);
            throw error;
        }
    }

    async getChannel() {
        if (!this.isConnected || !this.channel) {
            await this.connect();
        }
        return this.channel;
    }

    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            this.isConnected = false;
            console.log('RabbitMQ connection ditutup');
        } catch (error) {
            console.error('Error saat menutup RabbitMQ connection:', error);
        }
    }
}

// Singleton instance
const rabbitmqConnection = new RabbitMQConnection();

export default rabbitmqConnection;