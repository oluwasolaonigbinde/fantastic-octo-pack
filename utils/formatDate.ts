export const formatDate = (date: Date | string) => {
  if (typeof date === "string") {
    date = new Date(date);
  }
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayOfWeekIndex = date.getDay();
  const dayOfWeek = daysOfWeek[dayOfWeekIndex];

  const dayOfMonth = date.getDate();
  const suffix = getSuffix(dayOfMonth);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${dayOfWeek} ${dayOfMonth}${suffix} ${month}, ${year}`;
};

const getSuffix = (day:number) => {
  if (day >= 10 && day <= 13) return "th";

  const lastDigit = day % 10;
  switch (lastDigit) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};
