// Rentang Excel serial yang dianggap wajar: 2000-01-01 s/d 2100-12-31. Di luar
// itu hampir pasti bukan tanggal — mis. kolom harga atau berat yang terbaca
// sebagai tanggal karena posisi kolom bergeser.
const MIN_EXCEL_SERIAL = 36526;
const MAX_EXCEL_SERIAL = 73415;

const pad = (value) => String(value).padStart(2, "0");

const standardizeDate = (input) => {
  if (input == null) return null;

  // 1️⃣ Excel date serial number
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null;
    if (input < MIN_EXCEL_SERIAL || input > MAX_EXCEL_SERIAL) return null;

    // Excel epoch: 1899-12-30
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + input * 86400000);
    return date.toISOString().slice(0, 10) + " 00:00:00";
  }

  // 2️⃣ Date object
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    return input.toISOString().slice(0, 10) + " 00:00:00";
  }

  // 3️⃣ String (DD/MM/YYYY atau YYYY-MM-DD, pemisah jam spasi atau "T")
  if (typeof input !== "string") return null;

  const value = input.trim();
  if (!value) return null;

  let [datePart, timePart = "00:00:00"] = value.split(/[ T]/);

  if (datePart.includes("/")) {
    const [day, month, year] = datePart.split("/");
    if (!year || !month || !day) return null;
    datePart = `${year}-${pad(month)}-${pad(day)}`;
  } else {
    const [year, month, day] = datePart.split("-");
    if (!year || !month || !day) return null;
    datePart = `${year}-${pad(month)}-${pad(day)}`;
  }

  const time = timePart.split(":");
  while (time.length < 3) time.push("00");
  timePart = time.slice(0, 3).map(pad).join(":");

  const result = `${datePart} ${timePart}`;

  // Nilai yang bukan tanggal harus ditolak, bukan diteruskan apa adanya.
  return isValidDate(result) ? result : null;
};

const addDays = (input) => {
  if (!isValidDate(input)) {
    return null;
  }

  const [datePart, timePart] = input.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);

  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  date.setDate(date.getDate() + 30); // <-- changed line

  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, "0");
  const newDay = String(date.getDate()).padStart(2, "0");
  const newHours = String(date.getHours()).padStart(2, "0");
  const newMinutes = String(date.getMinutes()).padStart(2, "0");
  const newSeconds = String(date.getSeconds()).padStart(2, "0");

  return `${newYear}-${newMonth}-${newDay} ${newHours}:${newMinutes}:${newSeconds}`;
};

// Selain mencocokkan pola "YYYY-MM-DD HH:mm:ss", memastikan tanggalnya
// benar-benar ada: menolak 2026-02-31, bulan 13, jam 25, dan sejenisnya.
const isValidDate = (dateString) => {
  if (typeof dateString !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) return false;

  const [datePart, timePart] = dateString.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);

  if (month < 1 || month > 12 || day < 1) return false;
  if (hours > 23 || minutes > 59 || seconds > 59) return false;

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const truncate = (str, max = 512) =>
  str.length > max ? str.slice(0, max) + " ...[TRUNCATED]" : str;

const normalizeTiktokVariantToShopeeStyle = (input) => {
  if (input == null) return input;

  let value = String(input).trim();
  if (!value) return value;

  return value
    .replace(/\s+-\s+/g, ",")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ");
};

export { standardizeDate, addDays, truncate, normalizeTiktokVariantToShopeeStyle };
