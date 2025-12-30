import { format } from "date-fns";

export function formatShiftWindow(startsAt: Date, endsAt: Date) {
  return `${format(startsAt, "d MMM HH:mm")} - ${format(endsAt, "HH:mm")}`;
}
