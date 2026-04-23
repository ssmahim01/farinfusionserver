import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { CouponServices } from "./coupon.service";

const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponServices.createCoupon(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Coupon created successfully",
    data: result,
  });
});

const applyCoupon = catchAsync(async (req: Request, res: Response) => {
  const { code, total } = req.body;

  const result = await CouponServices.applyCoupon(code, total);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon applied",
    data: result,
  });
});

const getAllCoupons = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponServices.getAllCoupons(
    req.query as Record<string, string>,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupons retrieved",
    data: result.data,
    meta: result.meta,
  });
});

export const CouponControllers = {
  createCoupon,
  applyCoupon,
  getAllCoupons,
};
