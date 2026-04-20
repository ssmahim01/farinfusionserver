export enum DiscountType {
  PERCENT = "PERCENT",
  FIXED = "FIXED",
}

export interface ICoupon {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiryDate: Date;
  usageLimit?: number;
  usedCount?: number;
  isActive?: boolean;
  isDeleted?: boolean;
}