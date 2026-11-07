import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "params" | "query";

function validate(schema: ZodType, part: RequestPart): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten(),
      });
    }

    if (part === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        configurable: true,
      });
      next();
      return;
    }

    const target = req[part] as Record<string, unknown>;
    Object.keys(target).forEach((key) => delete target[key]);
    Object.assign(target, result.data);
    next();
  };
}

export const validateBody = (schema: ZodType) => validate(schema, "body");
export const validateParams = (schema: ZodType) => validate(schema, "params");
export const validateQuery = (schema: ZodType) => validate(schema, "query");
