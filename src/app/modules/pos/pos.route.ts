import express from "express";
import { POSControllers } from "./pos.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createPOSOrderZodSchema,
  updatePOSOrderStatusZodSchema,
} from "./pos.validation";

const router = express.Router();

router.post(
  "/orders",
  checkAuth(Role.ADMIN, Role.MANAGER),
  validateRequest(createPOSOrderZodSchema),
  POSControllers.createPOSOrder
);

router.get(
  "/orders",
  checkAuth(Role.ADMIN, Role.MANAGER),
  POSControllers.getAllPOSOrders
);

router.get(
  "/orders/:id",
  checkAuth(Role.ADMIN, Role.MANAGER),
  POSControllers.getSinglePOSOrder
);

router.patch(
  "/orders/:id/status",
  checkAuth(Role.ADMIN, Role.MANAGER),
  validateRequest(updatePOSOrderStatusZodSchema),
  POSControllers.updatePOSOrderStatus
);

export const posRoutes = router;