import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().min(5).max(50),
  description: z.string().min(10),
  price: z.number().positive(),
  category: z.enum(["sale", "service", "job", "other"]),
});

export const updateAnnouncementSchema = announcementSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const announcementsQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().positive().default(1),
});
