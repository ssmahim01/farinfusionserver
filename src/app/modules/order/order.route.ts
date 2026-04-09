import express from "express";
import { OrderControllers } from "./order.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = express.Router();

router.post(
  "/",
  OrderControllers.createOrder
);

router.get(
  "/my-orders",
  checkAuth(Role.CUSTOMER, Role.MODERATOR, Role.MANAGER, Role.ADMIN, Role.TELLICELSS),
  OrderControllers.getMyOrders
);

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.MANAGER, Role.TELLICELSS),
  OrderControllers.getAllOrders
);

router.get(
  "/trash",
  checkAuth(Role.ADMIN, Role.MANAGER),
  OrderControllers.getAllTrashOrders
);

router.get(
  "/:id",
  checkAuth(...Object.values(Role)),
  OrderControllers.getSingleOrder
);

router.patch(
  "/:id",
  checkAuth(...Object.values(Role)),
  OrderControllers.updateOrder
);

router.patch(
  "/:id/confirm-status",
  checkAuth(...Object.values(Role)),
  OrderControllers.updateOrderStatus
);

router.patch(
  "/:id/status",
  checkAuth(...Object.values(Role)),
  OrderControllers.updateCompleteOrder
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN),
  OrderControllers.deleteOrder
);

export const orderRoutes = router;