import express from "express";
import { Role } from "../user/user.interface";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { ProductControllers } from "./product.controller";
import { createProductZodSchema, updateProductZodSchema } from "./product.validation";

const router = express.Router();

router.post(
    '/create-product', 
    checkAuth(Role.ADMIN),
    multerUpload.array('images', 3),
    validateRequest(createProductZodSchema), 
    ProductControllers.createProduct
)

router.get("/all-products", ProductControllers.getAllProducts)
router.get("/all-trash-products", ProductControllers.getAllTrashProducts)
router.get("/:slug", ProductControllers.getSingleProduct)
router.delete("/:id", checkAuth(Role.ADMIN), ProductControllers.deleteProduct)
router.patch(
    "/:id", 
    checkAuth(Role.ADMIN), 
    multerUpload.array('images', 3),
    validateRequest(updateProductZodSchema), 
    ProductControllers.updateProduct
)

export const productRoutes = router;
