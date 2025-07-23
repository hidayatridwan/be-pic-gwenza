import { GetObjectCommand } from "@aws-sdk/client-s3";
import * as XLSX from "xlsx";
import constants from "../utils/constants.js";
import { addTwentySevenDays, standardizeDate } from "../utils/format.js";
import { publish, subscribe } from "../utils/rabbitmq.js";
import { prismaClient } from "../apps/database.js";
import { s3Client } from "../apps/s3.client.js";

const uploadWorker = async () => {
  console.log("Upload worker started");

  await subscribe(
    process.env.UPLOAD_ORDER_QUEUE,
    async (payload) => await getFileFromS3(payload)
  );
};

const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const getFileFromS3 = async (payload) => {
  const { bucket, key, channel, created_by } = payload;

  const getObjectParams = { Bucket: bucket, Key: key };
  const { Body } = await s3Client.send(new GetObjectCommand(getObjectParams));

  const fileBuffer = await streamToBuffer(Body);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });

  const sheetName = workbook.SheetNames[0];
  const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
  });

  const arraySheetData =
    channel === constants.TIKTOK ? sheetData.slice(2) : sheetData.slice(1);

  return publishData(channel, created_by, key, arraySheetData);
};

const publishData = async (channel, created_by, key, sheetData) => {
  let rowsBatch = [];
  for (const item of sheetData) {
    const newItem = [];
    if (channel === constants.TIKTOK) {
      // TIKTOK 0(order id),7(name),8(variant),9(qty),27(date created) || 4(tipe order)
      if (item[4] === "Pre-order") {
        if (standardizeDate(item[27]) === null) {
          continue;
        }

        newItem.push(item[0]);
        newItem.push(item[7]);
        newItem.push(item[8]);
        newItem.push(item[9]);
        newItem.push(standardizeDate(item[27]));
        newItem.push(addTwentySevenDays(standardizeDate(item[27])));
        newItem.push(channel);
        newItem.push(created_by);
        rowsBatch.push(newItem);
      }
    } else {
      // SHOPEE 0(order id),12(name),14(variant),17(qty),8(date created),6(expired)
      if (standardizeDate(item[8]) === null) {
        continue;
      }

      newItem.push(item[0]);
      newItem.push(item[12]);
      newItem.push(item[14]);
      newItem.push(item[17]);
      newItem.push(standardizeDate(item[8]));
      newItem.push(addTwentySevenDays(standardizeDate(item[8])));
      newItem.push(channel);
      newItem.push(created_by);
      rowsBatch.push(newItem);
    }

    if (rowsBatch.length >= constants.BATCH_LIMIT) {
      await publish(process.env.PROCESS_ORDER_QUEUE, rowsBatch);
      console.log("Batch published:", rowsBatch.length);
      rowsBatch = [];
    }
  }

  if (rowsBatch.length > 0) {
    await publish(process.env.PROCESS_ORDER_QUEUE, rowsBatch);
    console.log("Batch published:", rowsBatch.length);
  }

  await prismaClient.import.update({
    data: {
      is_processed: true,
    },
    where: {
      file_name: key,
    },
  });
};

export { uploadWorker };
