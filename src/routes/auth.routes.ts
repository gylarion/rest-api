import { Router } from "express";

import {
  getMe,
  login,
  logout,
  refresh,
  register,
} from "../controllers/auth.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";
import { validateBody } from "../middleware/validate.ts";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "../validators/auth.validator.ts";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/refresh", validateBody(refreshSchema), refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);

export default router;
