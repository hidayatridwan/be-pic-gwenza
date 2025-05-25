import { prismaClient } from "../apps/database.js";
import { logger } from "../apps/logging.js";
import { subscribe } from "../utils/rabbitmq.js";

const orderWorker = async () => {
  console.log("Order worker started");

  await subscribe(process.env.PROCESS_ORDER_QUEUE, async (batch) => {
    try {
      const ordersData = batch.map((order) => ({
        order_number: order[0], // channel
        product_name: order[1], // product_name
        variant_name: order[2]?.trim() ? order[2] : "Default", // variant_name
        quantity: parseInt(order[3], 10), // quantity
        start_date: order[4] == null ? null : new Date(order[4]), // start_date
        end_date: order[5] == null ? null : new Date(order[5]), // end_date
        channel: order[6], // channel
        created_by: order[7], // created_by
      }));

      await prismaClient.order.createMany({
        data: ordersData,
        skipDuplicates: true, // Ensures duplicates are not inserted
      });

      console.log("Batch inserted:", batch.length);
    } catch (err) {
      console.log(err.message);
      logger.error(err.message);
    }
  });
};

export { orderWorker };
