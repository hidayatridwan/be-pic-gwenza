import { GetObjectCommand } from "@aws-sdk/client-s3";
import * as XLSX from "xlsx";
import constants from "../utils/constants.js";
import { addTwentySevenDays, standardizeDate } from "../utils/format.js";
import { prismaClient } from "../apps/database.js";
import { s3Client } from "../apps/s3.client.js";
import { ImportType } from "../generated/prisma/index.js";
import { publish, sendToDlq, subscribe } from "../utils/pubsub.js";

// ============= ORDER ============== //
const uploadWorker = async () => {
  console.log("Upload worker started");

  const { consumerTag, cancel } = await subscribe(
    process.env.UPLOAD_ORDER_QUEUE,
    async (payload) => {
      await getFileFromS3(payload, ImportType.ORDER)
    },
    {
      prefetch: 5, // Process up to 5 messages concurrently
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
    return await publishData(channel, created_by, key, arraySheetData);
  } else if (importType === ImportType.DELIVERY) {
    return await publishDataDelivery(channel, created_by, key, arraySheetData);
  } else if (importType === ImportType.CANCEL) {
    return await publishDataCancel(channel, created_by, key, arraySheetData);
  } else {
    throw new Error("Invalid import type");
  }
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

// ============= DELIVERY ============== //
const uploadDeliveryWorker = async () => {
  console.log("Upload delivery worker started");

  const { consumerTag, cancel } = await subscribe(
    process.env.UPLOAD_DELIVERY_QUEUE,
    async (payload) => {
      await getFileFromS3(payload, ImportType.DELIVERY)
    },
    {
      prefetch: 5, // Process up to 5 messages concurrently
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

const publishDataDelivery = async (channel, created_by, key, sheetData) => {
  let rowsBatch = [];
  for (const item of sheetData) {
    const newItem = [];
    if (channel === constants.TIKTOK) {
      // TIKTOK 0(order id), 27(date created), 30(date delivery), 37(waybill_number) || 4(tipe order)
      if (item[4] === "Pre-order") {
        if (standardizeDate(item[27]) === null) {
          continue;
        }

        newItem.push(item[0]);
        newItem.push(standardizeDate(item[30]));
        newItem.push(item[37]);
        newItem.push(channel);
        newItem.push(created_by);
        rowsBatch.push(newItem);
      }
    } else {
      // SHOPEE 0(order id), 7(date delivery), 3(waybill_number), 8(date created)
      if (standardizeDate(item[8]) === null) {
        continue;
      }

      newItem.push(item[0]);
      newItem.push(standardizeDate(item[7]));
      newItem.push(item[3]);
      newItem.push(channel);
      newItem.push(created_by);
      rowsBatch.push(newItem);
    }

    if (rowsBatch.length >= constants.BATCH_LIMIT) {
      await publish(process.env.PROCESS_DELIVERY_QUEUE, rowsBatch);
      console.log("Batch delivery published:", rowsBatch.length);
      rowsBatch = [];
    }
  }

  if (rowsBatch.length > 0) {
    await publish(process.env.PROCESS_DELIVERY_QUEUE, rowsBatch);
    console.log("Batch delivery published:", rowsBatch.length);
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

// ============= CANCEL ============== //
const uploadCancelWorker = async () => {
  console.log("Upload cancel worker started");

  const { consumerTag, cancel } = await subscribe(
    process.env.UPLOAD_CANCEL_QUEUE,
    async (payload) => {
      await getFileFromS3(payload, ImportType.CANCEL)
    },
    {
      prefetch: 5, // Process up to 5 messages concurrently
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
      // TIKTOK 0(order id), 1(status), 27(date created) || 4(tipe order)
      if (item[4] === "Pre-order") {
        if (standardizeDate(item[27]) === null) {
          continue;
        }

        newItem.push(item[0]);
        newItem.push(item[1]);
        newItem.push(channel);
        newItem.push(created_by);
        rowsBatch.push(newItem);
      }
    } else {
      // SHOPEE 0(order id), 1(status), 8(date created)
      if (standardizeDate(item[8]) === null) {
        continue;
      }

      newItem.push(item[0]);
      newItem.push(item[1]);
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

export { uploadWorker, uploadDeliveryWorker, uploadCancelWorker };
