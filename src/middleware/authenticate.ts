import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: number;
      };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authorization.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    if (typeof payload.sub !== "number") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = { sub: payload.sub };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
