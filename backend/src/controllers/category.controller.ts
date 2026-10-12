import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/db";

const createCategorySchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(20, "Code must not exceed 20 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Code must only contain letters, numbers, hyphens, or underscores")
    .transform((val) => val.trim().toUpperCase()),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  isActive: z.boolean().optional().default(true),
});

const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .transform((val) => val.trim())
    .optional(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/categories
 * Returns paginated categories list with optional search and status filtering
 */
export async function getCategories(req: Request, res: Response): Promise<void> {
  const { search, status } = req.query;
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
  const skip = (page - 1) * limit;

  // Build filter conditions
  const where: Record<string, unknown> = {};

  if (status === "active") {
    where.isActive = true;
  } else if (status === "inactive") {
    where.isActive = false;
  }

  if (search && typeof search === "string" && search.trim() !== "") {
    const term = search.trim();
    where.OR = [
      { code: { contains: term, mode: "insensitive" } },
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ];
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: { code: "asc" },
    }),
    prisma.category.count({ where }),
  ]);

  res.status(200).json({
    categories,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

/**
 * GET /api/categories/:id
 * Retrieves a single category by its UUID
 */
export async function getCategoryById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    res.status(404).json({ error: `Category with ID '${id}' not found` });
    return;
  }

  res.status(200).json({ category });
}

/**
 * POST /api/categories
 * Creates a new category. Validates unique code.
 */
export async function createCategory(req: Request, res: Response): Promise<void> {
  const parseResult = createCategorySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: "Validation error",
      details: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  const { code, name, description, isActive } = parseResult.data;

  // Check for duplicate code
  const existing = await prisma.category.findUnique({
    where: { code },
  });

  if (existing) {
    res.status(409).json({
      error: `Category with code '${code}' already exists. Please choose a unique code.`,
    });
    return;
  }

  const category = await prisma.category.create({
    data: {
      code,
      name,
      description,
      isActive,
    },
  });

  res.status(201).json({ category });
}

/**
 * PUT /api/categories/:id
 * Updates an existing category
 */
export async function updateCategory(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const parseResult = updateCategorySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: "Validation error",
      details: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing) {
    res.status(404).json({ error: `Category with ID '${id}' not found` });
    return;
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: parseResult.data,
  });

  res.status(200).json({ category: updatedCategory });
}

/**
 * DELETE /api/categories/:id
 * Deactivates a category (soft-deactivation: sets isActive = false).
 * Enforces zero permanent data loss to preserve historical audit trails and future product relations.
 */
export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing) {
    res.status(404).json({ error: `Category with ID '${id}' not found` });
    return;
  }

  const deactivated = await prisma.category.update({
    where: { id },
    data: { isActive: false },
  });

  res.status(200).json({
    message: `Category '${deactivated.name}' (${deactivated.code}) deactivated successfully`,
    category: deactivated,
  });
}
