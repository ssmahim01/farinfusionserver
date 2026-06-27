export const ProductBlogCategory = {
  SKINCARE: "SKINCARE",
  HAIRCARE: "HAIRCARE",
  BABY_CARE: "BABY_CARE",
  BEAUTY: "BEAUTY",
  COSMETICS: "COSMETICS",
  HEALTH: "HEALTH",
  LIFESTYLE: "LIFESTYLE",
  TUTORIAL: "TUTORIAL",
} as const;

export const ProductBlogStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
} as const;

export const ProductBlogContentType = {
  ARTICLE: "ARTICLE",
  VIDEO: "VIDEO",
} as const;

export const productBlogSearchableFields = [
  "title",
  "shortDescription",
  "content",
  "category",
  "tags",
];