/**
 * Centralized task image assignment utility.
 * Referenced here so the build pipeline keeps all images.
 */

const IMAGES = {
  banana: "/assets/generated/task-banana.dim_400x240.jpg",
  grapes: "/assets/generated/task-grapes.dim_400x240.jpg",
  juice: "/assets/generated/task-juice.dim_400x240.jpg",
  milk: "/assets/generated/task-milk.dim_400x240.jpg",
  food: "/assets/generated/task-food.dim_400x240.jpg",
  grocery: "/assets/generated/task-grocery.dim_400x240.jpg",
  cleaning: "/assets/generated/task-cleaning.dim_400x240.jpg",
  delivery: "/assets/generated/task-delivery.dim_400x240.jpg",
  helper: "/assets/generated/task-helper.dim_400x240.jpg",
  coding: "/assets/generated/task-coding.dim_400x240.jpg",
  dogwalk: "/assets/generated/task-dogwalk.dim_400x240.jpg",
  faucet: "/assets/generated/task-faucet.dim_400x240.jpg",
  furniture: "/assets/generated/task-furniture.dim_400x240.jpg",
  default: "/assets/generated/task-default.dim_400x240.jpg",
} as const;

export const DEFAULT_TASK_IMAGE = IMAGES.default;

/**
 * Returns the best image URL for a task based on title + category keywords.
 * Priority: keyword match (title/description) > category match > default.
 */
export function getTaskImage(
  title: string,
  category: string,
  description?: string,
): string {
  const combined = `${title} ${description ?? ""} ${category}`.toLowerCase();

  // STEP 1: Keyword detection (highest priority)
  if (combined.includes("banana")) return IMAGES.banana;
  if (combined.includes("grapes") || combined.includes("grape"))
    return IMAGES.grapes;
  if (combined.includes("juice")) return IMAGES.juice;
  if (combined.includes("milk")) return IMAGES.milk;
  if (combined.includes("food")) return IMAGES.food;

  // Dog / pet walk
  if (
    combined.includes("dog") ||
    combined.includes("pet") ||
    combined.includes("walk")
  )
    return IMAGES.dogwalk;

  // Furniture / assembly / install
  if (
    combined.includes("furniture") ||
    combined.includes("assembly") ||
    combined.includes("install") ||
    combined.includes("move")
  )
    return IMAGES.furniture;

  // Plumbing / repair
  if (
    combined.includes("plumb") ||
    combined.includes("faucet") ||
    combined.includes("water") ||
    combined.includes("pipe") ||
    combined.includes("repair") ||
    combined.includes("fix")
  )
    return IMAGES.faucet;

  // STEP 2: Category detection (fallback)
  const cat = category.toLowerCase();
  if (cat.includes("grocery") || cat.includes("shop")) return IMAGES.grocery;
  if (cat.includes("clean")) return IMAGES.cleaning;
  if (
    cat.includes("delivery") ||
    cat.includes("courier") ||
    cat.includes("errand")
  )
    return IMAGES.delivery;
  if (
    cat.includes("helper") ||
    cat.includes("assist") ||
    cat.includes("pharma")
  )
    return IMAGES.helper;
  if (cat.includes("cod") || cat.includes("tech") || cat.includes("it"))
    return IMAGES.coding;

  // Also check title/description for category-like words
  if (combined.includes("grocery") || combined.includes("shop"))
    return IMAGES.grocery;
  if (combined.includes("clean")) return IMAGES.cleaning;
  if (combined.includes("delivery") || combined.includes("courier"))
    return IMAGES.delivery;
  if (
    combined.includes("cod") ||
    combined.includes("tech") ||
    combined.includes("program")
  )
    return IMAGES.coding;

  // STEP 3: Default
  return IMAGES.default;
}
