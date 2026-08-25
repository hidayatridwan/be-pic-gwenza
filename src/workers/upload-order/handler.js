import { loadSheetFromS3 } from "./file.loader.js";
import { transformRows } from "./transformer.js";
import { publishInBatches } from "./batch.publisher.js";
import { prismaClient } from "../../apps/database.js";

export async function handleUploadOrder(payload) {
    const { bucket, key, channel, created_by } = payload.data;

    console.log(`📥 Processing file: ${key}`);

    // 🔒 Idempotency check
    const existing = await prismaClient.import.findUnique({
        where: { file_name: key },
    });

    if (existing?.is_processed) {
        console.log(`⚠️ File already processed: ${key}`);
        return;
    }

    try {
        const { headerRow, rows } = await loadSheetFromS3(
            bucket,
            key,
            channel
        );

        const transformedRows = transformRows(
            rows,
            channel,
            created_by,
            headerRow
        );

        const totalPublished = await publishInBatches(
            transformedRows,
            key
        );

        await prismaClient.import.update({
            where: { file_name: key },
            data: { is_processed: true },
        });

        console.log(`✅ Done. Total published: ${totalPublished}`);
    } catch (err) {
        console.error(`❌ Error processing file: ${key}`, err);
        throw err;
    }
}
