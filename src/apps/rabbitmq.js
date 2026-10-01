import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

const RECONNECT_DELAY_MS = 5000;

class RabbitMQConnection {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
        this.hasConnected = false; // Koneksi berikutnya dianggap reconnect
        this.isClosing = false; // close() dipanggil, jangan reconnect
        this.connecting = null; // Percobaan connect yang sedang berjalan
        this.reconnectTimer = null;
        this.reconnectListeners = [];
    }

    /**
     * Daftarkan callback yang dipanggil setiap kali koneksi pulih setelah
     * terputus. Consumer ikut mati bersama channel lama, jadi harus
     * didaftarkan ulang di channel baru.
     * @param {Function} listener - async (channel) => void
     */
    onReconnect(listener) {
        this.reconnectListeners.push(listener);
    }

    async connect() {
        if (this.isConnected) {
            console.log('RabbitMQ sudah terkoneksi');
            return this.channel;
        }

        // Pemanggil paralel (timer reconnect, publish dari request) berbagi
        // satu percobaan connect supaya tidak membuka koneksi ganda.
        if (!this.connecting) {
            this.connecting = this.openConnection().finally(() => {
                this.connecting = null;
            });
        }

        return this.connecting;
    }

    async openConnection() {
        let connection;

        try {
            console.log('Menghubungkan ke RabbitMQ...');
            connection = await amqp.connect(process.env.RABBITMQ_URL);

            // Handle connection errors
            connection.on('error', (err) => {
                console.error('RabbitMQ connection error:', err);
                if (this.connection === connection) {
                    this.isConnected = false;
                }
            });

            connection.on('close', () => {
                // Abaikan koneksi lama atau koneksi yang gagal dibuka
                if (this.connection !== connection) return;

                console.log('RabbitMQ connection closed');
                this.isConnected = false;
                this.channel = null;
                // Auto reconnect after 5 seconds
                this.scheduleReconnect();
            });

            const channel = await connection.createChannel();

            channel.on('error', (err) => {
                console.error('RabbitMQ channel error:', err);
            });

            channel.on('close', () => {
                // Ditunda satu tick: kalau channel tertutup karena koneksinya
                // putus, handler 'close' koneksi sudah jalan dan me-reset channel.
                setImmediate(() => {
                    if (this.isClosing || this.channel !== channel) return;

                    // Channel ditutup server (mis. precondition error) padahal
                    // koneksinya masih hidup. Tutup koneksinya supaya jalur
                    // reconnect yang membuat channel baru dan mendaftarkan ulang
                    // consumer.
                    this.isConnected = false;
                    connection.close().catch(() => {});
                });
            });

            const isReconnect = this.hasConnected;

            this.connection = connection;
            this.channel = channel;
            this.isConnected = true;
            this.hasConnected = true;

            console.log('✅ RabbitMQ berhasil terkoneksi');

            if (isReconnect) {
                this.notifyReconnect(channel);
            }

            return channel;
        } catch (error) {
            // AggregateError (mis. ECONNREFUSED ke ::1 dan 127.0.0.1) tidak punya message
            console.error('❌ Gagal connect ke RabbitMQ:', error.message || error.code);
            this.isConnected = false;
            connection?.close().catch(() => {});
            // Retry connection after 5 seconds
            this.scheduleReconnect();
            throw error;
        }
    }

    scheduleReconnect() {
        if (this.isClosing || this.reconnectTimer) return;

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            // Kegagalan sudah dicatat dan dijadwalkan ulang di openConnection()
            this.connect().catch(() => {});
        }, RECONNECT_DELAY_MS);
    }

    async notifyReconnect(channel) {
        for (const listener of this.reconnectListeners) {
            try {
                await listener(channel);
            } catch (error) {
                console.error('❌ Gagal memulihkan consumer setelah reconnect:', error);
            }
        }
    }

    async getChannel() {
        if (!this.isConnected || !this.channel) {
            await this.connect();
        }
        return this.channel;
    }

    async close() {
        this.isClosing = true;
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;

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