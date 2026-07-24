import type { TripStatus, TripStop, TripStopKind } from "./schema";
import { tripStatuses, tripStopKinds } from "./schema";

export const tripStatusLabels: Record<TripStatus, string> = {
  draft: "Draft",
  planned: "Planned",
  done: "Done",
};

export const tripStopKindLabels: Record<TripStopKind, string> = {
  place: "Place",
  event: "Event",
  stay: "Stay",
  custom: "Custom",
};

export function isTripStatus(value: string): value is TripStatus {
  return (tripStatuses as readonly string[]).includes(value);
}

export function isTripStopKind(value: string): value is TripStopKind {
  return (tripStopKinds as readonly string[]).includes(value);
}

export function groupStopsByDay(stops: TripStop[]) {
  const map = new Map<number, TripStop[]>();
  for (const stop of stops) {
    const list = map.get(stop.dayIndex) ?? [];
    list.push(stop);
    map.set(stop.dayIndex, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([dayIndex, dayStops]) => ({
      dayIndex,
      stops: dayStops.sort((a, b) => a.sortOrder - b.sortOrder),
    }));
}

export { tripStatuses, tripStopKinds };
