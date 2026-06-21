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
  checkAuth(Role.ADMIN, Role.MANAGER),
  validateRequest(createReviewZodSchema),
  ReviewControllers.createReview,
);

router.get("/", ReviewControllers.getAllReviews);

router.get(
  "/stats",
  checkAuth(Role.ADMIN, Role.MANAGER),
  ReviewControllers.getReviewStats,
);

router.get("/product/:productId", ReviewControllers.getProductReviews);

router.get("/:id", ReviewControllers.getSingleReview);

router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.MANAGER),
  validateRequest(updateReviewZodSchema),
  ReviewControllers.updateReview,
);

router.patch(
  "/:id/approve",
  checkAuth(Role.ADMIN, Role.MANAGER),
  ReviewControllers.approveReview,
);

router.patch(
  "/:id/reject",
  checkAuth(Role.ADMIN, Role.MANAGER),
  ReviewControllers.rejectReview,
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.MANAGER),
  ReviewControllers.deleteReview,
);

export const reviewRoutes = router;
