import express from "express";
import { OrderControllers } from "./order.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";


const router = express.Router()

router.post(
  "/create-order",
  OrderControllers.createOrder
);
// Get logged-in user's orders (similar to /me)
router.get(
    "/my-orders",
    checkAuth(...Object.values(Role)),
    OrderControllers.getMyOrders
);

// Get all orders ( ADMIN)
router.get(
    "/all-orders",
    checkAuth(Role.ADMIN, Role.MANAGER),
    OrderControllers.getAllOrders
);

// Get all orders (OWNER or ADMIN)
router.get(
    "/all-trash-orders",
    checkAuth(Role.ADMIN, Role.MANAGER),
    OrderControllers.getAllTrashOrders
);

// Get single order by ID
router.get(
    "/:id",
    OrderControllers.getSingleOrder
);

// Delete order by ID
router.delete(
    "/:id",
    checkAuth(Role.ADMIN),
    OrderControllers.deleteOrder
);

// Update order by ID
router.patch(
    "/:id",
    checkAuth(...Object.values(Role)),
    OrderControllers.updateOrder
);

export const orderRoutes = router;