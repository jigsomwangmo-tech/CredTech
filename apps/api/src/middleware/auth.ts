import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@ndi/shared";

export type AuthUser = {
  id: string;
  didHash: `0x${string}`;
  role: UserRole;
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ code: "NDI_LOGIN_REQUIRED", message: "NDI login is required" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET ?? "dev-secret") as AuthUser;
    return next();
  } catch {
    return res.status(401).json({ code: "NDI_LOGIN_REQUIRED", message: "Invalid NDI session" });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ code: "INVALID_REQUEST", message: "Insufficient role" });
    }

    return next();
  };
}
