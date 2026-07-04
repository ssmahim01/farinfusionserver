import express from "express";
import { Role } from "../user/user.interface";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { ProductPurchaseControllers } from "./productPurchase.controller";
import { ProductPurchaseValidation } from "./productPurchase.validation";

const router = express.Router();

router.post(
  "/create",
 checkAuth(...Object.values(Role)),
  //   validateRequest(
  //     ProductPurchaseValidation.createProductPurchaseValidationSchema,
  //   ),
  ProductPurchaseControllers.createPurchase,
);

router.get(
  "/",
  checkAuth(...Object.values(Role)),
  ProductPurchaseControllers.getAllPurchases,
);

router.get(
  "/:id",
  checkAuth(...Object.values(Role)),
  ProductPurchaseControllers.getSinglePurchase,
);

router.get(
  "/stats/overview",
  checkAuth(...Object.values(Role)),
  ProductPurchaseControllers.getPurchaseStats,
);

router.patch(
  "/status/:id",
  checkAuth(...Object.values(Role)),
  ProductPurchaseControllers.updatePurchaseStatus,
);

router.patch(
  "/:id",
 checkAuth(...Object.values(Role)),
  //   validateRequest(
  //     ProductPurchaseValidation.updateProductPurchaseValidationSchema,
  //   ),
  ProductPurchaseControllers.updatePurchase,
);

router.delete(
  "/:id",
  checkAuth(...Object.values(Role)),
  ProductPurchaseControllers.deletePurchase,
);

export const ProductPurchaseRoutes = router;
