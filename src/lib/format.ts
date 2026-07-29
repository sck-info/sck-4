import { format } from "date-fns";

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "TBD";
  try {
    // If it's a string, avoid timezone offset shifting by parsing the date parts directly
    let d: Date;
    if (typeof date === "string") {
      // Expecting "yyyy-MM-dd"
      const parts = date.split("-");
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        d = new Date(date);
      }
    } else {
      d = date;
    }
    
    if (isNaN(d.getTime())) return "TBD";
    return format(d, "dd-MMM-yyyy");
  } catch {
    return "TBD";
  }
}

export function formatTimeStr(time: string | null | undefined): string {
  if (!time) return "TBD";
  const cleanTime = time.trim();
  const match = cleanTime.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match) {
    let hour = parseInt(match[1]);
    const minute = match[2];
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${String(displayHour).padStart(2, "0")}:${minute} ${ampm} IST`;
  }
  if (/AM|PM/i.test(cleanTime)) {
    const displayTime = cleanTime.toUpperCase().replace(/\s*IST/i, "");
    return `${displayTime} IST`;
  }
  return `${cleanTime} IST`;
}

export function formatTimeRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return "TBD";
  
  const formatSingle = (t: string) => {
    const clean = t.trim();
    const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (match) {
      let hour = parseInt(match[1]);
      const minute = match[2];
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      return `${String(displayHour).padStart(2, "0")}:${minute} ${ampm}`;
    }
    return clean.toUpperCase().replace(/\s*IST/i, "");
  };

  const formattedStart = formatSingle(start);
  const formattedEnd = formatSingle(end);
  
  return `${formattedStart} - ${formattedEnd} IST`;
}
