import { prismaClient } from "../apps/database.js";
import { logger } from "../apps/logging.js";

const LOCK_NAME = "sync_product_variant_lock";

const syncWorker = async () => {
  try {
    console.log("Sync product variant started");

    // 🔒 Acquire MySQL advisory lock
    const [lock] = await prismaClient.$queryRaw`
      SELECT GET_LOCK(${LOCK_NAME}, 0) AS acquired
    `;

    if (!lock.acquired) {
      console.log("Another scheduler is running, exiting...");
      return;
    }

    await prismaClient.$transaction([
      // 1️⃣ Update orders → product_id (kalau product sudah ada)
      prismaClient.$executeRaw`
    UPDATE orders
    JOIN products ON products.product_name = orders.product_name
    SET orders.product_id = products.product_id
    WHERE orders.product_id IS NULL
  `,

      // 2️⃣ Update orders → variant_id (kalau variant sudah ada)
      prismaClient.$executeRaw`
    UPDATE orders
    JOIN variants ON variants.variant_name = orders.variant_name
    SET orders.variant_id = variants.variant_id
    WHERE orders.variant_id IS NULL
  `,

      // 3️⃣ Insert product baru
      prismaClient.$executeRaw`
    INSERT IGNORE INTO products (product_name)
    SELECT DISTINCT product_name
    FROM orders
    WHERE product_id IS NULL
  `,

      // 4️⃣ Insert variant baru
      prismaClient.$executeRaw`
    INSERT IGNORE INTO variants (variant_name)
    SELECT DISTINCT variant_name
    FROM orders
    WHERE variant_id IS NULL
  `,

      // 5️⃣ Update ulang orders → product_id
      prismaClient.$executeRaw`
    UPDATE orders
    JOIN products ON products.product_name = orders.product_name
    SET orders.product_id = products.product_id
    WHERE orders.product_id IS NULL
  `,

      // 6️⃣ Update ulang orders → variant_id
      prismaClient.$executeRaw`
    UPDATE orders
    JOIN variants ON variants.variant_name = orders.variant_name
    SET orders.variant_id = variants.variant_id
    WHERE orders.variant_id IS NULL
  `,

      // 7️⃣ Insert productvariants (many-to-many)
      prismaClient.$executeRaw`
    INSERT IGNORE INTO productvariants (product_id, variant_id)
    SELECT DISTINCT product_id, variant_id
    FROM orders
    WHERE product_id IS NOT NULL
      AND variant_id IS NOT NULL
  `
    ]);

    console.log("Sync product variant finished");
  } catch (err) {
    logger.error("Sync error: " + err);
  } finally {
    // 🔓 Release lock
    await prismaClient.$queryRaw`
      SELECT RELEASE_LOCK(${LOCK_NAME})
    `;
  }
};

syncWorker().catch((err) => logger.error(err));
