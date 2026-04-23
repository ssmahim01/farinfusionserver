import express from "express";
import { PermissionControllers } from "./permission.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createPermissionZodSchema,
  updateUserPermissionZodSchema,
} from "./permission.validation";

const router = express.Router();

router.post(
  "/",
  checkAuth(Role.ADMIN),
  validateRequest(createPermissionZodSchema),
  PermissionControllers.createPermission,
);

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.MANAGER),
  PermissionControllers.getAllPermissions,
);

router.patch(
  "/assign/:id",
  checkAuth(Role.ADMIN),
  validateRequest(updateUserPermissionZodSchema),
  PermissionControllers.assignPermissionsToUser,
);

export const permissionRoutes = router;
