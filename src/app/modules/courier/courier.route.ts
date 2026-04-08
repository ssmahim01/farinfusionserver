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

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.MANAGER),
  CourierControllers.getAllCouriers
);

router.get(
  "/:id",
  checkAuth(...Object.values(Role)),
  CourierControllers.getSingleCourier
);

router.get(
  "/order/:orderId",
  checkAuth(...Object.values(Role)),
  CourierControllers.getCourierByOrderId
);

export const courierRoutes = router;