import { Router } from "express";
import { Role } from "@prisma/client";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";
import { verifyCsrfOrigin } from "../middlewares/csrf.middleware";

const router = Router();

// Read endpoints: accessible by all authenticated roles
router.get("/", authenticate, getCategories);
router.get("/:id", authenticate, getCategoryById);

// Mutating endpoints: strictly restricted to ADMIN and INVENTORY_MANAGER
router.post(
  "/",
  authenticate,
  requireRole(Role.ADMIN, Role.INVENTORY_MANAGER),
  verifyCsrfOrigin,
  createCategory
);

router.put(
  "/:id",
  authenticate,
  requireRole(Role.ADMIN, Role.INVENTORY_MANAGER),
  verifyCsrfOrigin,
  updateCategory
);

router.delete(
  "/:id",
  authenticate,
  requireRole(Role.ADMIN, Role.INVENTORY_MANAGER),
  verifyCsrfOrigin,
  deleteCategory
);

export default router;
