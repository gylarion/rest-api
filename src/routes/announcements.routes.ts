import { Router } from "express";

import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from "../controllers/announcements.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.ts";
import {
  announcementSchema,
  announcementsQuerySchema,
  idParamsSchema,
  updateAnnouncementSchema,
} from "../validators/announcements.validator.ts";

const router = Router();

router.get("/", validateQuery(announcementsQuerySchema), getAnnouncements);
router.get("/:id", validateParams(idParamsSchema), getAnnouncement);
router.post("/", authenticate, validateBody(announcementSchema), createAnnouncement);
router.patch(
  "/:id",
  authenticate,
  validateParams(idParamsSchema),
  validateBody(updateAnnouncementSchema),
  updateAnnouncement,
);
router.delete(
  "/:id",
  authenticate,
  validateParams(idParamsSchema),
  deleteAnnouncement,
);

export default router;
