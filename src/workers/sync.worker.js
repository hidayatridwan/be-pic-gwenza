import { prismaClient } from "../apps/database.js";
import { logger } from "../apps/logging.js";

const syncWorker = async () => {
  try {
    console.log("Sync product variant started");

    const countSync = await prismaClient.order.count({
      where: {
        OR: [
          {
            product_id: null,
          },
          {
            variant_id: null,
          },
        ],
      },
    });

    if (countSync > 0) {
      const products = await prismaClient.order.findMany({
        distinct: ["product_name"],
        orderBy: {
          product_name: "asc",
        },
        select: {
          product_name: true,
        },
      });

      const uniqueProducts = [
        ...new Map(
          products.map((p) => [p.product_name.trim().toLowerCase(), p])
        ).values(),
      ];

      await prismaClient.product.createMany({
        data: uniqueProducts,
        skipDuplicates: true,
      });
      console.log(`products synced: ${uniqueProducts.length}`);

      const variants = await prismaClient.order.findMany({
        distinct: ["variant_name"],
        orderBy: {
          variant_name: "asc",
        },
        select: {
          variant_name: true,
        },
      });

      const uniqueVariants = [
        ...new Map(
          variants.map((v) => [v.variant_name.trim().toLowerCase(), v])
        ).values(),
      ];

      await prismaClient.variant.createMany({
        data: uniqueVariants,
        skipDuplicates: true,
      });
      console.log(`variants synced: ${uniqueVariants.length}`);

      await prismaClient.$executeRaw`UPDATE orders
        JOIN products ON products.product_name = orders.product_name
        SET orders.product_id = products.product_id
        WHERE orders.product_id IS NULL`;

      await prismaClient.$executeRaw`UPDATE orders
        JOIN variants ON variants.variant_name = orders.variant_name
        SET orders.variant_id = variants.variant_id
        WHERE orders.variant_id IS NULL`;
      console.log(`update orders synced: ${uniqueVariants.length}`);

      await prismaClient.$executeRaw`INSERT IGNORE INTO
          productvariants (product_id, variant_id)
        SELECT DISTINCT
          product_id,
          variant_id
        FROM
          orders`;
      console.log(`product variants synced: ${uniqueVariants.length}`);

      console.log("Sync product variant finished");
    }
  } catch (err) {
    logger.error("Sync error: " + err.message);
  }
};

export { syncWorker };
