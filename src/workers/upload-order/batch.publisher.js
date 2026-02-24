import publisher from "../../utils/rabbitmq/publisher.js";
import constants from "../../utils/constants.js";

const { PROCESS_ORDER_REQUESTED } = process.env;

export async function publishInBatches(rows, key) {
    let total = 0;
    let batchNumber = 0;

    for (let i = 0; i < rows.length; i += constants.BATCH_LIMIT) {
        const batch = rows.slice(i, i + constants.BATCH_LIMIT);
        batchNumber++;

        await publisher.publish(PROCESS_ORDER_REQUESTED, {
            event: PROCESS_ORDER_REQUESTED,
            data: batch,
            timestamp: new Date().toISOString(),
        });

        total += batch.length;

        console.log(
            `📤 Batch #${batchNumber} published (${batch.length}) | ${key}`
        );
    }

    return total;
}
