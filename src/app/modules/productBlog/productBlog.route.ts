import express from "express";

import { ProductBlogControllers } from "./productBlog.controller";
import { ProductBlogValidation } from "./productBlog.validation";

import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";

import { Role } from "../user/user.interface";

const router = express.Router();

router.post(
  "/",
  checkAuth(Role.ADMIN, Role.MODERATOR),
  validateRequest(ProductBlogValidation.createProductBlogValidationSchema),
  ProductBlogControllers.createProductBlog,
);

router.get("/", ProductBlogControllers.getAllProductBlogs);

router.get("/:idOrSlug", ProductBlogControllers.getSingleProductBlog);

router.patch("/:id/view", ProductBlogControllers.increaseView);

router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.MODERATOR),

  ProductBlogControllers.updateProductBlog,
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN),
  ProductBlogControllers.deleteProductBlog,
);

export const ProductBlogRoutes = router;
