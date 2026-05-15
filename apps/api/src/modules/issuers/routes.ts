import { Router } from "express";
import { db, issuers } from "@ndi/db";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../lib/asyncHandler";
import { registerIssuerOnchain } from "../../services/contractService";

export const issuerRouter = Router();

issuerRouter.post(
  "/register",
  requireAuth,
  requireRole("issuer", "admin"),
  asyncHandler(async (req, res) => {
    const { organizationName, walletAddress } = req.body;
    const [issuer] = await db
      .insert(issuers)
      .values({
        userId: req.user!.id,
        organizationName,
        walletAddress,
        issuerDidHash: req.user!.didHash,
        active: true,
      })
      .returning();

    const chain = await registerIssuerOnchain(walletAddress, req.user!.didHash);

    res.status(201).json({ issuer, chain });
  }),
);

issuerRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json(await db.select().from(issuers));
  }),
);
