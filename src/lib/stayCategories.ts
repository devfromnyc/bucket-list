import type { StayCategory } from "./schema";
import { stayCategories } from "./schema";

export const stayCategoryLabels: Record<StayCategory, string> = {
  hotel: "Hotel",
  airbnb: "Airbnb",
  vacation_rental: "Vacation rental",
  hostel: "Hostel",
  other: "Other",
};

export function isStayCategory(value: string): value is StayCategory {
  return (stayCategories as readonly string[]).includes(value);
}

export { stayCategories };
