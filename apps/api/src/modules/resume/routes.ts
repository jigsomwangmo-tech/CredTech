import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, consentRequests, holders, resumes } from "@ndi/db";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../lib/asyncHandler";
import { requestConsent } from "../ndi/ndiService";
import { australiaGradeToGpa, bhutanPercentageToGpa, indiaGradeToGpa, usGradeToGpa } from "./gpa";

export const resumeRouter = Router();

resumeRouter.post(
  "/create",
  requireAuth,
  requireRole("holder"),
  asyncHandler(async (req, res) => {
    const [holder] = await db.select().from(holders).where(eq(holders.userId, req.user!.id));
    const [resume] = await db.insert(resumes).values({ holderId: holder.id, ...req.body }).returning();
    res.status(201).json(resume);
  }),
);

resumeRouter.patch(
  "/update",
  requireAuth,
  requireRole("holder"),
  asyncHandler(async (req, res) => {
    const [resume] = await db.update(resumes).set({ ...req.body, updatedAt: new Date() }).where(eq(resumes.id, req.body.id)).returning();
    res.json(resume);
  }),
);

resumeRouter.post(
  "/request-consent",
  requireAuth,
  asyncHandler(async (req, res) => {
    const ndi = await requestConsent({
      holderDidHash: req.body.holderDidHash,
      requesterDidHash: req.user!.didHash,
      scopes: req.body.scopes,
      selectiveDisclosure: req.body.selectiveDisclosure ?? { allowedFields: [], hiddenFields: [] },
    });
    const [request] = await db
      .insert(consentRequests)
      .values({
        requesterId: req.user!.id,
        holderId: req.body.holderId,
        scopes: req.body.scopes,
        selectiveDisclosure: req.body.selectiveDisclosure ?? {},
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      })
      .returning();
    res.status(201).json({ request, ndi });
  }),
);

resumeRouter.get(
  "/:holderId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [resume] = await db.select().from(resumes).where(eq(resumes.holderId, req.params.holderId));
    if (!resume) return res.status(404).json({ code: "NOT_FOUND", message: "Resume not found" });
    res.json(resume);
  }),
);

resumeRouter.post("/gpa", (req, res) => {
  const { system, value } = req.body;
  const gpa =
    system === "bhutan"
      ? bhutanPercentageToGpa(Number(value))
      : system === "india"
        ? indiaGradeToGpa(Number(value))
        : system === "us"
          ? usGradeToGpa(String(value))
          : australiaGradeToGpa(String(value));
  res.json({ gpa: Number(gpa.toFixed(2)) });
});
