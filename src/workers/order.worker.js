import { subscribe, sendToDlq } from "../utils/pubsub.js";
import { prismaClient } from "../apps/database.js";
import { logger } from "../apps/logging.js";
import { OrderStatus } from "../generated/prisma/index.js";

const orderWorker = async () => {
  console.log("Order worker started");

  await subscribe(
    process.env.PROCESS_ORDER_QUEUE,
    async (payload) => {
      if (!Array.isArray(payload)) {
        console.error(payload);
        throw new Error("Invalid payload format: expected an array of orders");
      }

      try {
        const ordersData = payload.map((order) => ({
          order_number: order[0], // channel
          product_name: order[1], // product_name
          variant_name: order[2]?.trim() ? order[2] : "Default", // variant_name
          quantity: Number(order[3], 10), // quantity
          start_date: order[4] == null ? null : new Date(order[4]), // start_date
          end_date: order[5] == null ? null : new Date(order[5]), // end_date
          channel: order[6], // channel
          created_by: order[7], // created_by
        }));

        await Promise.all(
          ordersData.map(async (order) => {
            await prismaClient.order.updateMany({
              data: { status: OrderStatus.OPEN },
              where: {
                order_number: order.order_number
              }
            });
          })
        );

        await prismaClient.order.createMany({
          data: ordersData,
          skipDuplicates: true, // Ensures duplicates are not inserted
        });

        console.log("Batch inserted:", payload.length);
      } catch (err) {
        logger.error("Error updating orders in DB:", err);
        throw err; // rethrow so onError in subscribe will handle DLQ
      }
    },
    {
      prefetch: 5, // Process up to 5 messages concurrently
      requeueOnError: false, // Don't requeue failed messages
      queueOptions: {
        // Additional queue options
      },
      onError: async (err, msg) => {
        // Custom error handling
        console.error('Message processing failed:', err);
        // Maybe send to dead letter queue
        await sendToDlq(msg);
      },
      onCancel: () => {
        console.log('Consumer was cancelled');
      }
    }
  );
};

const cancelWorker = async () => {
  console.log("Cancel worker started");
  await subscribe(
    process.env.PROCESS_CANCEL_QUEUE,
    async (payload) => {
      if (!Array.isArray(payload)) {
        throw new Error("Invalid payload format: expected an array of orders");
      }

      try {
        await prismaClient.order.updateMany({
          where: {
            order_number: {
              in: payload.map((order) => order[0])
            }
          },
          data: {
            status: OrderStatus.CANCEL
          },
        });
      } catch (err) {
        logger.error("Error updating orders in DB:", err);
        throw err; // rethrow so onError in subscribe will handle DLQ
      }
    },
    {
      prefetch: 5, // Process up to 5 messages concurrently
      requeueOnError: false, // Don't requeue failed messages
      queueOptions: {
        // Additional queue options
      },
      onError: async (err, msg) => {
        // Custom error handling
        console.error('Message processing failed:', err);
        // Maybe send to dead letter queue
        await sendToDlq(msg);
      },
      onCancel: () => {
        console.log('Consumer was cancelled');
      }
    }
  );
}

export { orderWorker, cancelWorker };
