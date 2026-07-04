import express from "express";

import { ProductVerificationControllers } from "./productVerification.controller";
import { ProductVerificationValidation } from "./productVerification.validation";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { checkAuth } from "../../middlewares/checkAuth";

const router = express.Router();

router.post(
  "/",
checkAuth(...Object.values(Role)),
  // validateRequest(
  //   ProductVerificationValidation.createProductVerificationValidationSchema,
  // ),
  ProductVerificationControllers.createProductVerification,
);

router.get("/", ProductVerificationControllers.getAllProductVerifications);
router.patch(
  "/:id/view",
  ProductVerificationControllers.increaseView,
);

router.get(
  "/:idOrSlug",
  ProductVerificationControllers.getSingleProductVerification,
);

router.patch(
  "/:id",
 checkAuth(...Object.values(Role)),
 
  ProductVerificationControllers.updateProductVerification,
);

router.delete(
  "/:id",
 checkAuth(...Object.values(Role)),
  ProductVerificationControllers.deleteProductVerification,
);

export const ProductVerificationRoutes = router;
