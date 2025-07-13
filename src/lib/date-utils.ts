import { format, startOfWeek, endOfWeek } from 'date-fns';

function getOrdinal(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
}

export function getDailyNoteTitle(date: Date = new Date()): string {
  const day = date.getDate();
  // Manually construct the format string to include the ordinal.
  // Example: "MMMM d" -> "October 26", then add "'th'" -> "October 26th", then ", yyyy"
  return format(date, `MMMM d'${getOrdinal(day)}', yyyy`);
}

export function getWeeklyNoteTitle(date: Date = new Date()): string {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
  const end = endOfWeek(date, { weekStartsOn: 1 });
  
  // Handle cases where the week spans across months
  const startMonth = format(start, 'MMM');
  const endMonth = format(end, 'MMM');

  const startFormat = format(start, 'd');
  const endFormat = format(end, 'd, yyyy');

  if (startMonth === endMonth) {
      return `Week of ${startMonth} ${startFormat}-${endFormat}`;
  } else {
      return `Week of ${startMonth} ${startFormat} - ${endMonth} ${endFormat}`;
  }
}
