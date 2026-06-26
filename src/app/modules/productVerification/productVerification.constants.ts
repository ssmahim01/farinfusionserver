export const VerificationContentType = {
  VIDEO: "VIDEO",
  PDF: "PDF",
  ARTICLE: "ARTICLE",
  EXTERNAL_LINK: "EXTERNAL_LINK",
} as const;

export const VerificationStatus = {
  PUBLISHED: "PUBLISHED",
  DRAFT: "DRAFT",
} as const;

export const VerificationCategory = {
  COSMETICS: "COSMETICS",
  SKIN_CARE: "SKIN_CARE",
  HEALTH: "HEALTH",
  PERFUME: "PERFUME",
  ELECTRONICS: "ELECTRONICS",
  OTHERS: "OTHERS",
} as const;

export const verificationSearchableFields = [
  "title",
  "slug",
  "shortDescription",
  "tags",
];