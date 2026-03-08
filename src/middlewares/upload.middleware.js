import multer from "multer";
import multerS3 from "multer-s3";
import { s3Client } from "../apps/s3.client.js";

const uploadMiddleware = (path) => {
  return multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.S3_BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      acl: path === "orders" ? undefined : "public-read", // This makes uploaded files publicly accessible
      key: (req, file, cb) => {
        cb(null, `${path}/${Date.now()}_${file.originalname}`);
      },
    }),
  })
}

export { uploadMiddleware };
