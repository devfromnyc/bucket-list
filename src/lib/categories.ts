import type { Category } from "./schema";
import { categories } from "./schema";

export const categoryLabels: Record<Category, string> = {
  food: "Food",
  entertainment: "Entertainment",
  kid_friendly: "Kid friendly",
  parks_outdoor: "Parks / outdoor",
  other: "Other",
};

export function isCategory(value: string): value is Category {
  return (categories as readonly string[]).includes(value);
}

export { categories };
