const standardizeDate = (input) => {
  if (input == null) return null;

  // 1️⃣ Excel date serial number
  if (typeof input === "number") {
    // Excel epoch: 1899-12-30
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + input * 86400000);
    return date.toISOString().slice(0, 10) + " 00:00:00";
  }

  // 2️⃣ Date object
  if (input instanceof Date) {
    return input.toISOString().slice(0, 10) + " 00:00:00";
  }

  // 3️⃣ String (baru masuk logic lama)
  if (typeof input !== "string") return null;

  let datePart, timePart;

  if (input.includes(" ")) {
    [datePart, timePart] = input.split(" ");
  } else {
    datePart = input;
    timePart = "00:00:00";
  }

  if (datePart.includes("/")) {
    const [day, month, year] = datePart.split("/");
    datePart = `${year}-${month}-${day}`;
  }

  if (timePart.split(":").length === 2) {
    timePart += ":00";
  }

  return `${datePart} ${timePart}`;
};

const addTwentySevenDays = (input) => {
  if (!isValidDate(input)) {
    return null;
  }

  const [datePart, timePart] = input.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);

  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  date.setDate(date.getDate() + 27); // <-- changed line

  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, "0");
  const newDay = String(date.getDate()).padStart(2, "0");
  const newHours = String(date.getHours()).padStart(2, "0");
  const newMinutes = String(date.getMinutes()).padStart(2, "0");
  const newSeconds = String(date.getSeconds()).padStart(2, "0");

  return `${newYear}-${newMonth}-${newDay} ${newHours}:${newMinutes}:${newSeconds}`;
};

const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  return regex.test(dateString);
};

export { standardizeDate, addTwentySevenDays };
