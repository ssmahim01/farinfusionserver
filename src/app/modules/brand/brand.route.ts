import express from "express";

import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
// import { createCategoryZodSchema } from "../category/category.validation";
import { createBrandZodSchema, updateBrandZodSchema } from "./brand.validation";
import { validateRequest } from "../../middlewares/validateRequest";
import { BrandControllers } from "./brand.controller";
import {CategoryControllers} from "../category/category.controller";

const router = express.Router();

router.post(
    '/create-brand', 
    checkAuth(Role.ADMIN, Role.MANAGER),
    multerUpload.single('image'),
    validateRequest(createBrandZodSchema), 
    BrandControllers.createBrand
)

router.get("/all-brands", BrandControllers.getAllBrands)
router.get("/all-trash-brands", BrandControllers.getAllTrashBrands)
router.get("/:slug", BrandControllers.getSingleBrand)
router.delete("/:id", checkAuth(Role.ADMIN, Role.MANAGER), BrandControllers.deleteBrand)
router.patch(
    "/:id", 
    checkAuth(Role.ADMIN, Role.MANAGER), 
    multerUpload.single('image'),
    validateRequest(updateBrandZodSchema), 
    BrandControllers.updateBrand
)
// trash service added
router.post("/brand-trash/:id", checkAuth(Role.ADMIN, Role.MANAGER), BrandControllers.updateBrandTrash)

export const brandRoutes = router;
