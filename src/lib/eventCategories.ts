import type { EventCategory } from "./schema";
import { eventCategories } from "./schema";

export const eventCategoryLabels: Record<EventCategory, string> = {
  concert: "Concert",
  community: "Community",
  free_public: "Free / public",
  festival: "Festival",
  sports: "Sports",
  other: "Other",
};

export function isEventCategory(value: string): value is EventCategory {
  return (eventCategories as readonly string[]).includes(value);
}

export { eventCategories };
