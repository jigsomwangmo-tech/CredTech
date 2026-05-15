import { Router } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, users } from "@ndi/db";
import { asyncHandler } from "../../lib/asyncHandler";
import { loginWithNDI, verifyConsentProof } from "../ndi/ndiService";

export const authRouter = Router();

authRouter.post(
  "/ndi-login",
  asyncHandler(async (req, res) => {
    const { ndiToken, role = "holder", displayName = "NDI User", email } = req.body;
    const ndiSession = await loginWithNDI({ ndiToken, role, displayName });

    const [existing] = await db.select().from(users).where(eq(users.didHash, ndiSession.didHash));
    const [user] = existing
      ? [existing]
      : await db
          .insert(users)
          .values({ didHash: ndiSession.didHash, displayName, email, role, ndiVerified: ndiSession.verified, lastLoginAt: new Date() })
          .returning();

    const token = jwt.sign({ id: user.id, didHash: user.didHash, role: user.role }, process.env.JWT_SECRET ?? "dev-secret", {
      expiresIn: "8h",
    });

    res.json({ token, user, ndi: { didHash: ndiSession.didHash, verified: ndiSession.verified, proofToken: ndiSession.proofToken } });
  }),
);

authRouter.post(
  "/verify-consent",
  asyncHandler(async (req, res) => {
    const valid = await verifyConsentProof(req.body.proof ?? "");
    res.json({ valid });
  }),
);
