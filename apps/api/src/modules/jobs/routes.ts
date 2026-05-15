import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, jobApplications, jobs } from "@ndi/db";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../lib/asyncHandler";

export const jobsRouter = Router();

jobsRouter.post(
  "/create",
  requireAuth,
  requireRole("employer"),
  asyncHandler(async (req, res) => {
    const [job] = await db.insert(jobs).values({ employerId: req.user!.id, ...req.body }).returning();
    res.status(201).json(job);
  }),
);

jobsRouter.get("/", asyncHandler(async (_req, res) => res.json(await db.select().from(jobs))));

jobsRouter.patch(
  "/:id",
  requireAuth,
  requireRole("employer"),
  asyncHandler(async (req, res) => {
    const [job] = await db.update(jobs).set({ ...req.body, updatedAt: new Date() }).where(eq(jobs.id, req.params.id)).returning();
    res.json(job);
  }),
);

jobsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("employer"),
  asyncHandler(async (req, res) => {
    const [job] = await db.update(jobs).set({ status: "closed", updatedAt: new Date() }).where(eq(jobs.id, req.params.id)).returning();
    res.json(job);
  }),
);

jobsRouter.post(
  "/:id/apply",
  requireAuth,
  requireRole("holder"),
  asyncHandler(async (req, res) => {
    const [application] = await db
      .insert(jobApplications)
      .values({ jobId: req.params.id, holderId: req.body.holderId, resumeId: req.body.resumeId })
      .returning();
    res.status(201).json(application);
  }),
);

jobsRouter.get(
  "/:id/applicants",
  requireAuth,
  requireRole("employer"),
  asyncHandler(async (req, res) => {
    res.json(await db.select().from(jobApplications).where(eq(jobApplications.jobId, req.params.id)));
  }),
);
