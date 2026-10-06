const JAKARTA_TIME_ZONE = "Asia/Jakarta";

export function parseJakartaDateTimeLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);

  const calendarDate = new Date(0);
  calendarDate.setUTCFullYear(year, month - 1, day);
  calendarDate.setUTCHours(0, 0, 0, 0);

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  calendarDate.setUTCHours(hour - 7, minute, 0, 0);
  return calendarDate;
}

export function formatJakartaDateTimeLocal(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function formatJakartaDateTime(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: JAKARTA_TIME_ZONE,
  }).format(date);
}

export function getDefaultJakartaElectionDateTimes(now = new Date()) {
  const jakartaDate = formatJakartaDateTimeLocal(now).slice(0, 10);
  const [year, month, day] = jakartaDate.split("-").map(Number);
  const nextDay = new Date(0);
  nextDay.setUTCFullYear(year, month - 1, day + 1);
  nextDay.setUTCHours(0, 0, 0, 0);

  const date = [
    String(nextDay.getUTCFullYear()).padStart(4, "0"),
    String(nextDay.getUTCMonth() + 1).padStart(2, "0"),
    String(nextDay.getUTCDate()).padStart(2, "0"),
  ].join("-");

  return {
    startsAt: `${date}T08:00`,
    endsAt: `${date}T15:00`,
    resultsOpenAt: `${date}T15:01`,
  };
}
