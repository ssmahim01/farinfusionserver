import express from "express";
import { AuthControllers } from "./auth.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { changePasswordZodSchema } from "./auth.validation";
const router = express.Router();

router.post("/login", AuthControllers.credentialLogin);
router.post("/logout", AuthControllers.logout);
router.post("/refresh-token", AuthControllers.getNewAccessToken);
router.post(
  "/change-password",
  checkAuth(...Object.values(Role)),
  validateRequest(changePasswordZodSchema),
  AuthControllers.changePassword,
);
router.post(
  "/admin/change-password",
  checkAuth(Role.ADMIN),
  AuthControllers.adminChangePassword,
);

export const authRoutes = router;
