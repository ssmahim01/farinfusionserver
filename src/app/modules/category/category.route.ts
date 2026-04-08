import express from "express";
import { CategoryControllers } from "./category.controller";
import { Role } from "../user/user.interface";
import { createCategoryZodSchema, updateCategoryZodSchema } from "./category.validation";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";

const router = express.Router();

router.post(
    '/create-category', 
    checkAuth(Role.ADMIN),
    multerUpload.single('image'),
    validateRequest(createCategoryZodSchema), 
    CategoryControllers.createCategory
)

router.get("/all-categories", CategoryControllers.getAllCategories)
router.get("/all-trash-categories", CategoryControllers.getAllTrashCategories)
router.get("/:slug", CategoryControllers.getSingleCategory)
router.delete("/:id", checkAuth(Role.ADMIN), CategoryControllers.deleteCategory)
router.patch(
    "/:id", 
    checkAuth(Role.ADMIN), 
    multerUpload.single('image'),
    validateRequest(updateCategoryZodSchema), 
    CategoryControllers.updateCategory
)

// trash category
router.post("/category-trash/:id", checkAuth(Role.ADMIN), CategoryControllers.updateCategoryTrash)

export const categoryRoutes = router;
