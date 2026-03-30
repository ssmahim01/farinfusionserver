import express from "express";
import { CourierControllers } from "./courier.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createCourierZodSchema,
  trackCourierZodSchema,
} from "./courier.validation";

const router = express.Router();

router.post(
  "/create",
  checkAuth(Role.ADMIN, Role.MANAGER),
  validateRequest(createCourierZodSchema),
  CourierControllers.createCourier
);

router.get(
  "/track/:trackingCode",
  checkAuth(...Object.values(Role)),
  validateRequest(trackCourierZodSchema),
  CourierControllers.trackCourier
);

export const courierRoutes = router;