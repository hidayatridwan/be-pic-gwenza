import { GetObjectCommand } from "@aws-sdk/client-s3";
import * as XLSX from "xlsx";
import constants from "../utils/constants.js";
import { addTwentySevenDays, standardizeDate } from "../utils/format.js";
import { prismaClient } from "../apps/database.js";
import { s3Client } from "../apps/s3.client.js";
import { ImportType } from "../generated/prisma/index.js";
import { publish, sendToDlq, subscribe } from "../utils/pubsub.js";

// ============= ORDER ============== //
const uploadOrderWorker = async () => {
  console.log("Upload order worker started");

  await subscribe(
    process.env.UPLOAD_ORDER_QUEUE,
    async (payload) => {
      await getFileFromS3(payload, ImportType.ORDER)
    },
    {
      prefetch: 1, // Process up to 1 messages concurrently
      requeueOnError: false, // Don't requeue failed messages
      queueOptions: {
        // Additional queue options
      },
      onError: async (err, msg) => {
        // Custom error handling
        console.error('Message processing failed:', err);
        // Maybe send to dead letter queue
        await sendToDlq(msg);
      },
      onCancel: () => {
        console.log('Consumer was cancelled');
      }
    }
  );
};

const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const getFileFromS3 = async (payload, importType) => {
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

  if (importType === ImportType.ORDER) {
    return await publishDataOrder(channel, created_by, key, arraySheetData);
  } else if (importType === ImportType.CANCEL) {
    return await publishDataCancel(channel, created_by, key, arraySheetData);
  } else {
    throw new Error("Invalid import type");
  }
};

const publishDataOrder = async (channel, created_by, key, sheetData) => {
  let rowsBatch = [];
  for (const item of sheetData) {
    const newItem = [];
    if (channel === constants.TIKTOK) {
      // TIKTOK 0(order id),7(name),8(variant),9(qty),29(date created) || 4(tipe order)
      if (item[4] === "Pre-order") {
        if (standardizeDate(item[29]) === null) {
          continue;
        } else if (item[7] == '') {
          continue;
        }

        newItem.push(item[0]);
        newItem.push(item[7]);
        newItem.push(item[8]);
        newItem.push(item[9]);
        newItem.push(standardizeDate(item[29]));
        newItem.push(addTwentySevenDays(standardizeDate(item[29])));
        newItem.push(channel);
        newItem.push(created_by);
        rowsBatch.push(newItem);
      }
    } else {
      // SHOPEE 0(order id),12(name),14(variant),17(qty),8(date created),6(expired)
      if (standardizeDate(item[8]) === null) {
        continue;
      } else if (item[12] == '') {
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

    await prismaClient.import.update({
      data: {
        is_processed: true,
      },
      where: {
        file_name: key,
      },
    });
  }
};

// ============= CANCEL ============== //
const uploadCancelWorker = async () => {
  console.log("Upload cancel worker started");

  const { consumerTag, cancel } = await subscribe(
    process.env.UPLOAD_CANCEL_QUEUE,
    async (payload) => {
      await getFileFromS3(payload, ImportType.CANCEL)
    },
    {
      prefetch: 1, // Process up to 1 messages concurrently
      requeueOnError: false, // Don't requeue failed messages
      queueOptions: {
        // Additional queue options
      },
      onError: async (err, msg) => {
        // Custom error handling
        console.error('Message processing failed:', err);
        // Maybe send to dead letter queue
        await sendToDlq(msg);
      },
      onCancel: () => {
        console.log('Consumer was cancelled');
      }
    }
  );
};

const publishDataCancel = async (channel, created_by, key, sheetData) => {
  let rowsBatch = [];
  for (const item of sheetData) {
    const newItem = [];
    if (channel === constants.TIKTOK) {
      // TIKTOK 0(order id), 1(status), 29(date created) || 4(tipe order)
      if (item[4] === "Pre-order") {
        if (standardizeDate(item[29]) === null) {
          continue;
        } else if (!item[1].toLowerCase().includes("batal")) {
          continue;
        }

        newItem.push(item[0]);
        newItem.push(channel);
        newItem.push(created_by);
        rowsBatch.push(newItem);
      }
    } else {
      // SHOPEE 0(order id), 1(status), 9(date created)
      if (standardizeDate(item[9]) === null) {
        continue;
      } else if (!item[1].toLowerCase().includes("batal")) {
        continue;
      }

      newItem.push(item[0]);
      newItem.push(channel);
      newItem.push(created_by);
      rowsBatch.push(newItem);
    }

    if (rowsBatch.length >= constants.BATCH_LIMIT) {
      await publish(process.env.PROCESS_CANCEL_QUEUE, rowsBatch);
      console.log("Batch cancel published:", rowsBatch.length);
      rowsBatch = [];
    }
  }

  if (rowsBatch.length > 0) {
    await publish(process.env.PROCESS_CANCEL_QUEUE, rowsBatch);
    console.log("Batch cancel published:", rowsBatch.length);

    await prismaClient.import.update({
      data: {
        is_processed: true,
      },
      where: {
        file_name: key,
      },
    });
  }
};

export { uploadOrderWorker, uploadCancelWorker };
