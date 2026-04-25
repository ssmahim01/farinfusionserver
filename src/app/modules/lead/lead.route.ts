import express from "express";

import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { createLeadZodSchema, updateLeadZodSchema } from "./lead.validation";
import { LeadControllers } from "./lead.controller";

const router = express.Router();

router.post(
  "/create-lead",
  checkAuth(Role.ADMIN, Role.MANAGER, Role.MODERATOR, Role.TELLICELSS),
  validateRequest(createLeadZodSchema),
  LeadControllers.createLead,
);

router.get("/fraud-check", LeadControllers.checkFraud);

router.get(
  "/all-leads",
  checkAuth(Role.ADMIN, Role.MANAGER, Role.MODERATOR, Role.TELLICELSS),
  LeadControllers.getAllLeads,
);
router.get(
  "/all-trash-leads",
  checkAuth(Role.ADMIN, Role.MANAGER, Role.MODERATOR, Role.TELLICELSS),
  LeadControllers.getAllTrashLeads,
);
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.MANAGER, Role.MODERATOR, Role.TELLICELSS),
  LeadControllers.getSingleLead,
);
router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.MANAGER, Role.MODERATOR, Role.TELLICELSS),
  LeadControllers.deleteLead,
);
router.patch(
  "/:id",
  validateRequest(updateLeadZodSchema),
  checkAuth(Role.ADMIN, Role.MANAGER, Role.MODERATOR, Role.TELLICELSS),
  LeadControllers.updateLead,
);

router.post(
  "/lead-trash/:id",
  checkAuth(Role.ADMIN, Role.MANAGER, Role.MODERATOR, Role.TELLICELSS),
  LeadControllers.updateLeadTrash,
);

export const leadRoutes = router;
