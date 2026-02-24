import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand
} from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.S3_URL,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
  },
});

export async function ensureBucket() {
  const bucketName = process.env.S3_BUCKET;

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
