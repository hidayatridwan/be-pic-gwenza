import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const getRequiredEnv = (key) => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const s3Endpoint = getRequiredEnv("S3_URL");
const s3AccessKey = getRequiredEnv("S3_KEY");
const s3SecretKey = getRequiredEnv("S3_SECRET");

export const s3Client = new S3Client({
  region: "auto",
  endpoint: s3Endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: s3AccessKey,
    secretAccessKey: s3SecretKey,
  },
});

export async function ensureBucket() {
  const bucketName = getRequiredEnv("S3_BUCKET");

  try {
    await s3Client.send(
      new HeadBucketCommand({ Bucket: bucketName })
    );

    console.log(`✅ Bucket "${bucketName}" sudah ada`);
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 404) {
      await s3Client.send(
        new CreateBucketCommand({ Bucket: bucketName })
      );

      console.log(`🪣 Bucket "${bucketName}" berhasil dibuat`);
    } else {
      console.error("❌ Gagal cek bucket:", error);
      throw error;
    }
  }
}
