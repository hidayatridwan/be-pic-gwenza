import { prismaClient } from "../../apps/database.js";
import { OrderStatus } from "../../generated/prisma/index.js";

export async function handleFailedOrder(payload) {
    try {
        const totalRecords = payload.data?.length || 0;

        console.log(`🚀 [FAILED-ORDER] Mulai proses failed | total: ${totalRecords}`);

        const result = await prismaClient.order.updateMany({
            where: {
                order_number: {
                    in: payload.data.map((order) => order[0])
                }
            },
            data: {
                status: OrderStatus.FAILED,
                failed_at: new Date(),
            },
        });

        console.log(
            `✅ [FAILED-ORDER] Selesai | updated: ${result.count} | total batch: ${totalRecords}`
        );

    } catch (err) {
        console.error(`❌ [FAILED-ORDER] Gagal memproses failed batch`);
        console.error(err);
        throw err;
    }
}
