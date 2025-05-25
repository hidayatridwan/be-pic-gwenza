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

export { generateBatchId };
