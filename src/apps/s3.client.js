import { S3Client, PutBucketPolicyCommand } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.S3_URL,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
  },
});

const setPublicBucketPolicy = async (bucketName) => {
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  };

  await s3Client.send(
    new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy),
    })
  );
  console.log(`Bucket ${bucketName} set to public read`);
};

// Run this for your bucket
await setPublicBucketPolicy(process.env.S3_BUCKET);
