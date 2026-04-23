import express from "express";
import { CouponControllers } from "./coupon.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createCouponZodSchema,
  applyCouponZodSchema,
} from "./coupon.validation";

const router = express.Router();

router.post(
  "/create",
  checkAuth(Role.ADMIN, Role.MANAGER),
  validateRequest(createCouponZodSchema),
  CouponControllers.createCoupon
);

router.post(
  "/apply",
  validateRequest(applyCouponZodSchema),
  CouponControllers.applyCoupon
);

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.MANAGER),
  CouponControllers.getAllCoupons
);

export const couponRoutes = router;