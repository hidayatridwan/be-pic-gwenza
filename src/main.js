import { ensureBucket } from "./apps/s3.client.js";
import { web } from "./apps/web.js";
import rabbitmqConnection from './apps/rabbitmq.js';
import queueSetup from './utils/rabbitmq/queue.js';
import dotenv from "dotenv";

dotenv.config();

const port = process.env.APP_PORT || 3000;

let isShuttingDown = false;

// ==========================
// 🚀 Bootstrap Application
// ==========================
async function bootstrap() {
  try {
    console.log('🚀 Starting BE PIC Gwenza...');

    // 1️⃣ Initialize S3 first
    console.log('\n🪣 Checking S3 bucket...');
    await ensureBucket();

    // 2️⃣ Connect RabbitMQ
    console.log('\n📡 Connecting to RabbitMQ...');
    await rabbitmqConnection.connect();

    console.log('\n⚙️ Setting up queues...');
    await queueSetup.setupAllQueues();

    // 3️⃣ Start Web Server
    web.listen(port, "0.0.0.0", () => {
      console.log(`✅ Server is running on port ${port}`);
    });

  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

// ==========================
// 🛑 Graceful Shutdown
// ==========================
async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 ${signal} received, shutting down gracefully...`);

  try {
    if (rabbitmqConnection) {
      await rabbitmqConnection.close();
      console.log('✅ RabbitMQ connection closed');
    }

    console.log('👋 Shutdown complete');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
}

// ==========================
// 🔔 Signal Listeners
// ==========================
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ==========================
// 🏁 Start App
// ==========================
bootstrap();