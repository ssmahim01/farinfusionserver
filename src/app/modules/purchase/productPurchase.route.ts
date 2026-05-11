import express from "express";
import { Role } from "../user/user.interface";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { ProductPurchaseControllers } from "./productPurchase.controller";
import { ProductPurchaseValidation } from "./productPurchase.validation";

const router = express.Router();

router.post(
  "/create",
  checkAuth(Role.ADMIN),
  //   validateRequest(
  //     ProductPurchaseValidation.createProductPurchaseValidationSchema,
  //   ),
  ProductPurchaseControllers.createPurchase,
);

router.get(
  "/",
  checkAuth(Role.ADMIN),
  ProductPurchaseControllers.getAllPurchases,
);

router.get(
  "/:id",
  checkAuth(Role.ADMIN),
  ProductPurchaseControllers.getSinglePurchase,
);

router.get(
  "/stats/overview",
  checkAuth(Role.ADMIN),
  ProductPurchaseControllers.getPurchaseStats,
);

router.patch(
  "/status/:id",
  checkAuth(Role.ADMIN),
  ProductPurchaseControllers.updatePurchaseStatus,
);

router.patch(
  "/:id",
  checkAuth(Role.ADMIN),
  //   validateRequest(
  //     ProductPurchaseValidation.updateProductPurchaseValidationSchema,
  //   ),
  ProductPurchaseControllers.updatePurchase,
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN),
  ProductPurchaseControllers.deletePurchase,
);

export const ProductPurchaseRoutes = router;
