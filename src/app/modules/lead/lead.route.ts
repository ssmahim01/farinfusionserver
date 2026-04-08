import express from "express";

import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { createLeadZodSchema, updateLeadZodSchema } from "./lead.validation";
import { LeadControllers } from "./lead.controller";

const router = express.Router();

router.post(
    '/create-lead', 
    checkAuth(Role.ADMIN, Role.MANAGER, Role.MODERATOR),
    validateRequest(createLeadZodSchema), 
    LeadControllers.createLead
)

router.get("/all-leads", checkAuth(Role.ADMIN, Role.MANAGER, Role.MODERATOR), LeadControllers.getAllLeads)
router.get("/all-trash-leads", checkAuth(Role.ADMIN, Role.MANAGER, Role.MODERATOR), LeadControllers.getAllTrashLeads)
router.get("/:id", checkAuth(Role.ADMIN, Role.MANAGER, Role.MODERATOR), LeadControllers.getSingleLead)
router.delete("/:id", checkAuth(Role.ADMIN, Role.MANAGER, Role.MODERATOR), LeadControllers.deleteLead)
router.patch(
    "/:id", 
    validateRequest(updateLeadZodSchema), 
    checkAuth(Role.ADMIN, Role.MANAGER, Role.MODERATOR),
    LeadControllers.updateLead
)

router.post("/lead-trash/:id", checkAuth(Role.ADMIN), LeadControllers.updateLeadTrash)

export const leadRoutes = router;
