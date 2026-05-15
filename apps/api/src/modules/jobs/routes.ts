import { readFile } from "node:fs/promises";
import { Router } from "express";
import multer from "multer";
import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { db, holders, jobApplications, jobs, users } from "@ndi/db";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../lib/asyncHandler";
import { hashDID, sha256Buffer } from "../../lib/hash";
import { createMockProofPayload, createProofRequest, getMockNDIProfile, subscribeWebhook, verifyConsentProof } from "../ndi/ndiService";

export const jobsRouter = Router();

const upload = multer({
  dest: process.env.UPLOAD_DIR ?? "uploads",
  fileFilter: (_req, file, cb) => cb(file.mimetype === "application/pdf" ? null : new Error("PDF only"), file.mimetype === "application/pdf"),
});

async function ensureDemoJobs() {
  const existing = await db.select().from(jobs);
  if (existing.length > 0) return existing;

  const employerDidHash = hashDID("did:bt:demo:employer");
  const [existingEmployer] = await db.select().from(users).where(eq(users.didHash, employerDidHash));
  const [employer] = existingEmployer
    ? [existingEmployer]
    : await db
        .insert(users)
        .values({
          didHash: employerDidHash,
          displayName: "Druk Holding and Investments",
          role: "employer",
          ndiVerified: true,
          lastLoginAt: new Date(),
        })
        .returning();

  return db
    .insert(jobs)
    .values([
      {
        employerId: employer.id,
        title: "Blockchain Credential Analyst",
        description: "Review credential verification workflows and support NDI-backed hiring operations.",
        requirements: ["NDI verified identity", "Education certificate", "CV PDF"],
      },
      {
        employerId: employer.id,
        title: "Graduate Software Trainee",
        description: "Build product features across web, API, and blockchain systems.",
        requirements: ["NDI login", "Academic certificate", "Resume"],
      },
    ])
    .returning();
}

jobsRouter.post(
  "/create",
  requireAuth,
  requireRole("employer"),
  asyncHandler(async (req, res) => {
    const [job] = await db.insert(jobs).values({ employerId: req.user!.id, ...req.body }).returning();
    res.status(201).json(job);
  }),
);

jobsRouter.get("/", asyncHandler(async (_req, res) => res.json(await ensureDemoJobs())));

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

jobsRouter.post(
  "/:id/apply-demo",
  upload.fields([
    { name: "cv", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
  ]),
  asyncHandler(async (req, res) => {
    const files = req.files as { cv?: Express.Multer.File[]; certificate?: Express.Multer.File[] } | undefined;
    const cv = files?.cv?.[0];
    const certificate = files?.certificate?.[0];

    if (!cv || !certificate) {
      return res.status(400).json({ code: "INVALID_REQUEST", message: "CV and certificate PDFs are required" });
    }

    const mockProfile = getMockNDIProfile();
    const applicantName = String(req.body.applicantName || mockProfile["Full Name"]);
    const applicantEmail = req.body.applicantEmail ? String(req.body.applicantEmail) : undefined;
    const holderDid = "did:key:mock-dorji-sonam";
    const holderDidHash = hashDID(holderDid);

    const [existingUser] = await db.select().from(users).where(eq(users.didHash, holderDidHash));
    const [user] = existingUser
      ? [existingUser]
      : await db
          .insert(users)
          .values({
            didHash: holderDidHash,
            displayName: applicantName,
            email: applicantEmail,
            role: "holder",
            ndiVerified: true,
            lastLoginAt: new Date(),
          })
          .returning();

    const [existingHolder] = await db.select().from(holders).where(eq(holders.holderDidHash, holderDidHash));
    const [holder] = existingHolder
      ? [existingHolder]
      : await db.insert(holders).values({ userId: user.id, holderDidHash }).returning();

    const cvHash = sha256Buffer(await readFile(cv.path));
    const certificateHash = sha256Buffer(await readFile(certificate.path));
    const ndiProof = await createProofRequest({
      proofName: `Apply for job: ${req.params.id}`,
      attributes: ["Full Name", "ID Number"],
      purpose: "ekyc",
    });
    await subscribeWebhook(ndiProof.proofRequestThreadId);

    const qrDataUrl = await QRCode.toDataURL(ndiProof.proofRequestURL);
    const [application] = await db
      .insert(jobApplications)
      .values({
        jobId: req.params.id,
        holderId: holder.id,
        status: "reviewing",
        verificationSummary: {
          applicantName,
          applicantEmail,
          holderDidHash,
          ndiProfile: mockProfile,
          documents: {
            cv: { fileName: cv.originalname, sha256: cvHash },
            certificate: { fileName: certificate.originalname, sha256: certificateHash },
          },
          ndi: {
            consentStatus: "pending",
            proofRequestThreadId: ndiProof.proofRequestThreadId,
            deepLinkURL: ndiProof.deepLinkURL,
            proofRequestURL: ndiProof.proofRequestURL,
          },
          result: "Waiting for holder consent in Bhutan NDI Wallet",
        },
      })
      .returning();

    res.status(201).json({ application, ndiProof: { ...ndiProof, qrDataUrl } });
  }),
);

jobsRouter.post(
  "/applications/:applicationId/ndi-approve-demo",
  asyncHandler(async (req, res) => {
    const [existing] = await db.select().from(jobApplications).where(eq(jobApplications.id, req.params.applicationId));
    const previousSummary =
      existing && typeof existing.verificationSummary === "object" && existing.verificationSummary
        ? (existing.verificationSummary as Record<string, unknown>)
        : {};
    const previousNdi = (previousSummary.ndi as Record<string, unknown> | undefined) ?? {};
    const threadId = String(previousNdi.proofRequestThreadId ?? "mock-thread");
    const consentProof =
      typeof req.body.consentProof === "string" ? req.body.consentProof : JSON.stringify(createMockProofPayload(threadId));
    const approved = await verifyConsentProof(consentProof);

    if (!approved) {
      return res.status(403).json({
        code: "ACCESS_DENIED_NDI_CONSENT_REQUIRED",
        message: "NDI consent is required before the application can be verified",
      });
    }

    const [application] = await db
      .update(jobApplications)
      .set({
        status: "verified",
        updatedAt: new Date(),
        verificationSummary: {
          ...previousSummary,
          consentProof,
          ndiProfile: getMockNDIProfile(),
          ndi: {
            ...previousNdi,
            consentStatus: "approved",
          },
          result: "NDI consent approved for Dorji Sonam. CV and certificate hashes recorded for employer verification.",
        },
      })
      .where(eq(jobApplications.id, req.params.applicationId))
      .returning();

    res.json({ application });
  }),
);

jobsRouter.get(
  "/:id/applicants",
  asyncHandler(async (req, res) => {
    res.json(await db.select().from(jobApplications).where(eq(jobApplications.jobId, req.params.id)));
  }),
);
