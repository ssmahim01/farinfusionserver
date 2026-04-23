import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status-codes";
import { Coupon } from "./coupon.model";
import { ICoupon, DiscountType } from "./coupon.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { couponSearchableFields } from "./coupon.constant";

const createCoupon = async (payload: ICoupon) => {
  const exists = await Coupon.findOne({ code: payload.code.toUpperCase() });

  if (exists) {
    throw new AppError(httpStatus.BAD_REQUEST, "Coupon already exists");
  }

  const coupon = await Coupon.create({
    ...payload,
    code: payload.code.toUpperCase(),
  });

  return coupon;
};

const applyCoupon = async (code: string, total: number) => {
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid coupon");
  }

  if (new Date() > new Date(coupon.expiryDate)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Coupon expired");
  }

  if (coupon.usedCount >= (coupon.usageLimit || 1)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Coupon limit exceeded");
  }

  if (total < (coupon.minOrderAmount || 0)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Minimum order ${coupon.minOrderAmount}`,
    );
  }

  let discount = 0;

  if (coupon.discountType === DiscountType.PERCENT) {
    discount = (total * coupon.discountValue) / 100;

    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = coupon.discountValue;
  }

  return {
    discount,
    finalTotal: total - discount,
    couponId: coupon._id,
  };
};

const getAllCoupons = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(
    Coupon.find({ isActive: true }),
    query,
  );

  const coupons = queryBuilder
    .search(couponSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    coupons.build(),
    queryBuilder.getMeta(),
  ]);

  return { data, meta };
};

export const CouponServices = {
  createCoupon,
  applyCoupon,
  getAllCoupons,
};
