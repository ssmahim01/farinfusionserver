import express from "express";
import { ReviewControllers } from "./review.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createReviewZodSchema,
  updateReviewZodSchema,
} from "./review.validation";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

router.post(
  "/",
 checkAuth(...Object.values(Role)),
  validateRequest(createReviewZodSchema),
  ReviewControllers.createReview,
);

router.get("/", ReviewControllers.getAllReviews);

router.get(
  "/stats",
 checkAuth(...Object.values(Role)),
  ReviewControllers.getReviewStats,
);

router.get("/product/:productId", ReviewControllers.getProductReviews);

router.get("/:id", ReviewControllers.getSingleReview);

router.patch(
  "/:id",
  checkAuth(...Object.values(Role)),
  validateRequest(updateReviewZodSchema),
  ReviewControllers.updateReview,
);

router.patch(
  "/:id/approve",
  checkAuth(...Object.values(Role)),
  ReviewControllers.approveReview,
);

router.patch(
  "/:id/reject",
  checkAuth(...Object.values(Role)),
  ReviewControllers.rejectReview,
);

router.delete(
  "/:id",
  checkAuth(...Object.values(Role)),
  ReviewControllers.deleteReview,
);

export const reviewRoutes = router;
