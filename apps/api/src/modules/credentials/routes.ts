import { readFile } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { db, credentials, issuers } from "@ndi/db";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../lib/asyncHandler";
import { createCredentialId, sha256Buffer } from "../../lib/hash";
import { issueCredentialOnchain, revokeCredentialOnchain, verifyCredentialOnchain } from "../../services/contractService";

const upload = multer({
  dest: process.env.UPLOAD_DIR ?? "uploads",
  fileFilter: (_req, file, cb) => cb(file.mimetype === "application/pdf" ? null : new Error("PDF only"), file.mimetype === "application/pdf"),
});

const credentialTypeIndex: Record<string, number> = {
  EDUCATION: 0,
  EMPLOYMENT: 1,
  WORKSHOP: 2,
  LICENSE: 3,
  OTHER: 4,
};

export const credentialRouter = Router();

credentialRouter.post(
  "/issue",
  requireAuth,
  requireRole("issuer"),
  upload.single("pdf"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ code: "INVALID_REQUEST", message: "PDF upload is required" });

    const [issuer] = await db.select().from(issuers).where(eq(issuers.userId, req.user!.id));
    if (!issuer) return res.status(403).json({ code: "NDI_DID_HASH_REQUIRED", message: "Issuer must be registered through NDI" });

    const buffer = await readFile(req.file.path);
    const documentHash = sha256Buffer(buffer);
    const holderDIDHash = req.body.holderDIDHash as `0x${string}`;
    const credentialId = createCredentialId(documentHash, holderDIDHash);
    const type = req.body.credentialType ?? "OTHER";
    const qrUrl = `${process.env.WEB_ORIGIN ?? "http://localhost:3000"}/verify/${credentialId}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl);
    const chain = await issueCredentialOnchain({
      credentialId,
      documentHash,
      holderDIDHash,
      credentialType: credentialTypeIndex[type] ?? 4,
    });

    const [credential] = await db
      .insert(credentials)
      .values({
        credentialId,
        documentHash,
        holderDidHash: holderDIDHash,
        issuerId: issuer.id,
        credentialType: type,
        title: req.body.title ?? req.file.originalname,
        fileName: req.file.originalname,
        filePath: path.resolve(req.file.path),
        qrUrl,
        txHash: chain.txHash,
      })
      .returning();

    res.status(201).json({ credential, qrDataUrl, chain });
  }),
);

credentialRouter.post(
  "/verify",
  asyncHandler(async (req, res) => {
    const credentialId = req.body.credentialId as `0x${string}`;
    const [credential] = await db.select().from(credentials).where(eq(credentials.credentialId, credentialId));
    const chain = await verifyCredentialOnchain(credentialId);
    res.json({ valid: Boolean(credential && !credential.revoked && chain.valid), credential, chain });
  }),
);

credentialRouter.post(
  "/revoke",
  requireAuth,
  requireRole("issuer"),
  asyncHandler(async (req, res) => {
    const credentialId = req.body.credentialId as `0x${string}`;
    const chain = await revokeCredentialOnchain(credentialId);
    const [credential] = await db.update(credentials).set({ revoked: true, updatedAt: new Date() }).where(eq(credentials.credentialId, credentialId)).returning();
    res.json({ credential, chain });
  }),
);

credentialRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [credential] = await db.select().from(credentials).where(eq(credentials.credentialId, req.params.id));
    if (!credential) return res.status(404).json({ code: "NOT_FOUND", message: "Credential not found" });
    res.json(credential);
  }),
);
