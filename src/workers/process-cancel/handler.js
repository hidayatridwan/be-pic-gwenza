import { prismaClient } from "../../apps/database.js";
import { OrderStatus } from "../../generated/prisma/index.js";

export async function handleCancelOrder(payload) {
    try {
        const totalRecords = payload.data?.length || 0;

        console.log(`🚀 [CANCEL-ORDER] Mulai proses cancel | total: ${totalRecords}`);

        const result = await prismaClient.order.updateMany({
            where: {
                order_number: {
                    in: payload.data.map((order) => order[0])
                }
            },
            data: {
                status: OrderStatus.CANCEL
            },
        });

        console.log(
            `✅ [CANCEL-ORDER] Selesai | updated: ${result.count} | total batch: ${totalRecords}`
        );

    } catch (err) {
        console.error(`❌ [CANCEL-ORDER] Gagal memproses cancel batch`);
        console.error(err);
        throw err;
    }
}
