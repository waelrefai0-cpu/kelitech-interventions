import dayjs from "dayjs";
import "dayjs/locale/fr";

dayjs.locale("fr");

export function formatDate(value?: string | null, pattern = "DD/MM/YYYY HH:mm") {
  return value ? dayjs(value).format(pattern) : "-";
}

export function fullName(user?: { firstName: string; lastName: string } | null) {
  return user ? `${user.firstName} ${user.lastName}` : "-";
}

export function minutesToHuman(minutes?: number | null) {
  if (!minutes) return "0 min";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

