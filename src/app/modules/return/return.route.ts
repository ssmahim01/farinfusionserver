import express from "express";
import { Role } from "../user/user.interface";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import { ReturnControllers } from "./return.controller";
import { ReturnValidations } from "./return.validation";

const router = express.Router();

router.post(
  "/create-return",
  checkAuth(Role.ADMIN, Role.MANAGER, Role.TELLICELSS),
//   validateRequest(ReturnValidations.createReturnValidationSchema),
  ReturnControllers.createReturn,
);

router.get(
  "/all-returns",
  checkAuth(Role.ADMIN, Role.MANAGER, Role.TELLICELSS),
  ReturnControllers.getAllReturns,
);

router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.MANAGER, Role.TELLICELSS),
  ReturnControllers.getSingleReturn,
);

router.patch(
  "/:id/status",
  checkAuth(Role.ADMIN, Role.MANAGER),
//   validateRequest(ReturnValidations.updateReturnStatusValidationSchema),
  ReturnControllers.updateReturnStatus,
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.MANAGER),
  ReturnControllers.deleteReturn,
);

export const returnRoutes = router;
