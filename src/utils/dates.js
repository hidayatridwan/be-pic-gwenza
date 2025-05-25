const standardizeDate = (input) => {
  let datePart, timePart;

  if (input.includes(" ")) {
    [datePart, timePart] = input.split(" ");
  } else {
    // Only date, no time
    datePart = input;
    timePart = "00:00:00";
  }

  if (datePart.includes("/")) {
    // Format: dd/mm/yyyy
    const [day, month, year] = datePart.split("/");
    datePart = `${year}-${month}-${day}`;
  } // else assume already yyyy-mm-dd

  // Handle missing or incomplete time
  if (!timePart) {
    timePart = "00:00:00";
  } else if (timePart.split(":").length === 2) {
    timePart = timePart + ":00"; // add seconds if missing
  }

  const dateTime = `${datePart} ${timePart}`;
  if (!isValidDate(dateTime)) {
    return null;
  }

  return dateTime;
};

const addOneMonth = (input) => {
  if (!isValidDate(input)) {
    return null;
  }

  const [datePart, timePart] = input.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);

  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  date.setMonth(date.getMonth() + 1);

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

export { standardizeDate, addOneMonth };
