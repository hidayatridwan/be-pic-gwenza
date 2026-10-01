import { prismaClient } from "../../apps/database.js";
import { Prisma } from "../../generated/prisma/index.js";
import { withDeadlockRetry } from "../../utils/retry.js";

// Batch 500 baris bisa lebih dari 5 detik (default Prisma) saat DB sibuk, dan
// transaksi yang kedaluwarsa membuat seluruh batch gagal.
const TRANSACTION_OPTIONS = { maxWait: 10000, timeout: 30000 };

export async function handleProcessOrder(payload) {
    try {
        const total = payload.data?.length || 0;

        console.log(`🚀 [PROCESS-ORDER] Start batch | total: ${total}`);

        const ordersRaw = payload.data;

        // =============================
        // 1️⃣ Extract distinct master data
        // =============================
        const productNames = [...new Set(ordersRaw.map(o => o[1]))].sort((a, b) => b.localeCompare(a));
        const variantNames = [...new Set(
            ordersRaw.map(o => o[2]?.trim() ? o[2] : "Default")
        )].sort((a, b) => b.localeCompare(a));

        await withDeadlockRetry("PROCESS-ORDER", () => prismaClient.$transaction(async (tx) => {

            // =============================
            // 2️⃣ Upsert products
            // =============================
            if (productNames.length > 0) {
                await tx.$executeRaw(
                    Prisma.sql`
                    INSERT IGNORE INTO products (product_name)
                    VALUES ${Prisma.join(
                        productNames.map(name => Prisma.sql`(${name})`)
                    )}
                `
                );
            }


            // =============================
            // 3️⃣ Upsert variants
            // =============================
            if (variantNames.length > 0) {
                await tx.$executeRaw(
                    Prisma.sql`
                        INSERT IGNORE INTO variants (variant_name)
                        VALUES ${Prisma.join(
                        variantNames.map(name => Prisma.sql`(${name})`)
                    )}
                    `
                );
            }


            // =============================
            // 4️⃣ Fetch mapping
            // =============================
            const products = await tx.product.findMany({
                where: { product_name: { in: productNames } }
            });

            const variants = await tx.variant.findMany({
                where: { variant_name: { in: variantNames } }
            });

            const productMap = Object.fromEntries(
                products.map(p => [p.product_name.toLowerCase(), p.product_id])
            );

            const variantMap = Object.fromEntries(
                variants.map(v => [v.variant_name.toLowerCase(), v.variant_id])
            );

            // =============================
            // 5️⃣ Insert orders directly with FK
            // =============================
            const ordersData = ordersRaw.map(order => {
                const variantName = order[2]?.trim() ? order[2] : "Default";

                return {
                    order_number: order[0],
                    product_name: order[1],
                    variant_name: variantName,
                    product_id: productMap[order[1]?.toLowerCase()],
                    variant_id: variantMap[variantName.toLowerCase()],
                    quantity: Number(order[3]),
                    start_date: order[4] ? new Date(order[4]) : null,
                    end_date: order[5] ? new Date(order[5]) : null,
                    channel: order[6],
                    created_by: order[7]
                };
            });

            await tx.order.createMany({
                data: ordersData,
                skipDuplicates: true
            });

            if (ordersData.length > 0) {
                // Dibuka ulang berdasarkan unique key order (channel +
                // order_number + product_name + variant_name), bukan
                // order_number saja, supaya order channel lain dengan nomor
                // yang sama tidak ikut terbuka.
                await tx.$executeRaw(
                    Prisma.sql`
                        UPDATE orders
                        SET
                        status = 'OPEN',
                        closed_at = NULL
                        WHERE (channel, order_number, product_name, variant_name) IN (${Prisma.join(
                        ordersData.map(o =>
                            Prisma.sql`(${o.channel}, ${o.order_number}, ${o.product_name}, ${o.variant_name})`
                        )
                    )})
                    `
                );
            }

            const productVariantPairs = [
                ...new Set(
                    ordersData.map(o => `${o.product_id}-${o.variant_id}`)
                )
            ].map(pair => {
                const [productId, variantId] = pair.split("-");
                return { productId: Number(productId), variantId: Number(variantId) };
            });

            if (productVariantPairs.length > 0) {
                await tx.$executeRaw(
                    Prisma.sql`
                        INSERT IGNORE INTO productvariants (product_id, variant_id)
                        VALUES ${Prisma.join(
                        productVariantPairs.map(p =>
                            Prisma.sql`(${p.productId}, ${p.variantId})`
                        )
                    )}
                    `
                );
            }


        }, TRANSACTION_OPTIONS));

        console.log(`✅ [PROCESS-ORDER] Finished batch | total: ${total}`);

    } catch (err) {
        console.error(`❌ [PROCESS-ORDER] Gagal memproses batch`);
        console.error(err);
        throw err;
    }
}