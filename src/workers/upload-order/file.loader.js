import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../apps/s3.client.js";
import XLSX from "xlsx";
import constants from "../../utils/constants.js";

function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
}

export async function loadSheetFromS3(bucket, key, channel) {
    const { Body } = await s3Client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    const buffer = await streamToBuffer(Body);
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(
        workbook.Sheets[sheetName],
        { header: 1 }
    );

    return channel === constants.TIKTOK
        ? sheetData.slice(2)
        : sheetData.slice(1);
}
