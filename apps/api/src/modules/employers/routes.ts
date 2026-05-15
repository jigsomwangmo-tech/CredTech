import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, consentRequests } from "@ndi/db";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyCredentialOnchain } from "../../services/contractService";
import { requestConsent, subscribeWebhook, verifyConsentProof } from "../ndi/ndiService";

export const employerRouter = Router();

employerRouter.post(
  "/request-verification",
  requireAuth,
  requireRole("employer"),
  asyncHandler(async (req, res) => {
    const ndi = await requestConsent({
      holderDidHash: req.body.holderDidHash,
      requesterDidHash: req.user!.didHash,
      scopes: req.body.scopes ?? ["education", "employment", "certificate"],
      selectiveDisclosure: req.body.selectiveDisclosure ?? { allowedFields: [], hiddenFields: [] },
    });
    await subscribeWebhook(ndi.proofRequestThreadId);
    const [request] = await db
      .insert(consentRequests)
      .values({
        requesterId: req.user!.id,
        holderId: req.body.holderId,
        scopes: req.body.scopes ?? ["education", "employment", "certificate"],
        selectiveDisclosure: req.body.selectiveDisclosure ?? {},
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      })
      .returning();

    res.status(201).json({ request, ndi });
  }),
);

employerRouter.post(
  "/verify-candidate",
  requireAuth,
  requireRole("employer"),
  asyncHandler(async (req, res) => {
    const approved = await verifyConsentProof(req.body.consentProof ?? "");
    if (!approved) {
      return res.status(403).json({
        code: "ACCESS_DENIED_NDI_CONSENT_REQUIRED",
        message: "NDI consent is required before candidate data can be shared",
      });
    }

    if (req.body.consentRequestId) {
      await db
        .update(consentRequests)
        .set({ status: "approved", ndiConsentProof: req.body.consentProof, updatedAt: new Date() })
        .where(eq(consentRequests.id, req.body.consentRequestId));
    }

    const results = await Promise.all((req.body.credentialIds ?? []).map((id: `0x${string}`) => verifyCredentialOnchain(id)));
    res.json({ verified: results.every(result => result.valid), credentials: results });
  }),
);
