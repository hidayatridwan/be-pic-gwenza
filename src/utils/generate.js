const generatedIds = new Set();

const generateBatchId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const idLength = 6;

  let id;
  do {
    id = Array.from(
      { length: idLength },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  } while (generatedIds.has(id));

  generatedIds.add(id);
  return id;
};



const buildS3Url = (path) => {
  if (!path) return null;
  const baseUrl = process.env.S3_URL?.replace(/\/$/, "") || "";
  const bucket = process.env.S3_BUCKET?.replace(/\/$/, "") || "";
  const filePath = path.replace(/^\//, "");
  return `${baseUrl}/${bucket}/${filePath}`;
}


export { generateBatchId, buildS3Url };
