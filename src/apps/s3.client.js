import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.S3_URL,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
  },
});
