import {
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import {
  announcementSchema,
  announcementsQuerySchema,
  idParamsSchema,
  updateAnnouncementSchema,
} from "./validators/announcements.validator.ts";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "./validators/auth.validator.ts";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

const userSchema = registry.register(
  "User",
  z.object({
    id: z.number().int(),
    username: z.string(),
    email: z.email(),
    name: z.string(),
  }),
);

const profileSchema = registry.register(
  "Profile",
  userSchema.extend({ createdAt: z.iso.datetime() }),
);

const tokensSchema = registry.register(
  "Tokens",
  z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
);

const authResponseSchema = registry.register(
  "AuthResponse",
  tokensSchema.extend({ user: userSchema }),
);

const announcementResponseSchema = registry.register(
  "Announcement",
  announcementSchema.extend({
    id: z.number().int(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    user: userSchema,
  }),
);

const jsonResponse = (schema: z.ZodType) => ({
  description: "Successful response",
  content: { "application/json": { schema } },
});

registry.registerPath({
  method: "post",
  path: "/auth/register",
  summary: "Register a new user",
  request: {
    body: { content: { "application/json": { schema: registerSchema } } },
  },
  responses: { 201: jsonResponse(authResponseSchema) },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  summary: "Log in",
  request: {
    body: { content: { "application/json": { schema: loginSchema } } },
  },
  responses: { 200: jsonResponse(authResponseSchema) },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  summary: "Refresh tokens",
  request: {
    body: { content: { "application/json": { schema: refreshSchema } } },
  },
  responses: { 200: jsonResponse(tokensSchema) },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  summary: "Log out",
  security: [{ bearerAuth: [] }],
  responses: { 204: { description: "Logged out" } },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  summary: "Get the current user",
  security: [{ bearerAuth: [] }],
  responses: { 200: jsonResponse(profileSchema) },
});

registry.registerPath({
  method: "get",
  path: "/announcements",
  summary: "Get announcements",
  request: { query: announcementsQuerySchema },
  responses: {
    200: jsonResponse(
      z.object({
        data: z.array(announcementResponseSchema),
        pagination: z.object({
          total: z.number().int(),
          page: z.number().int(),
          totalPages: z.number().int(),
          perPage: z.number().int(),
        }),
      }),
    ),
  },
});

registry.registerPath({
  method: "get",
  path: "/announcements/{id}",
  summary: "Get an announcement",
  request: { params: idParamsSchema },
  responses: { 200: jsonResponse(announcementResponseSchema) },
});

registry.registerPath({
  method: "post",
  path: "/announcements",
  summary: "Create an announcement",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: announcementSchema } } },
  },
  responses: { 201: jsonResponse(announcementResponseSchema) },
});

registry.registerPath({
  method: "patch",
  path: "/announcements/{id}",
  summary: "Update an announcement",
  security: [{ bearerAuth: [] }],
  request: {
    params: idParamsSchema,
    body: {
      content: { "application/json": { schema: updateAnnouncementSchema } },
    },
  },
  responses: { 200: jsonResponse(announcementResponseSchema) },
});

registry.registerPath({
  method: "delete",
  path: "/announcements/{id}",
  summary: "Delete an announcement",
  security: [{ bearerAuth: [] }],
  request: { params: idParamsSchema },
  responses: { 204: { description: "Announcement deleted" } },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Announcements API",
      version: "1.0.0",
      description: "REST API for an announcements board",
    },
    servers: [{ url: "http://localhost:3000" }],
  });
}
