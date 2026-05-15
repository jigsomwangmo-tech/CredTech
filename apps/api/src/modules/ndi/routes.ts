import { Router } from "express";
import { normalizeNDIEvent, registerWebhook, subscribeWebhook } from "./ndiService";
import { asyncHandler } from "../../lib/asyncHandler";

export const ndiRouter = Router();

ndiRouter.post(
  "/oauth/token",
  asyncHandler(async (req, res) => {
    const { client_id, client_secret } = req.body ?? {};

    if (
      client_id !== process.env.NDI_WEBHOOK_CLIENT_ID ||
      client_secret !== process.env.NDI_WEBHOOK_CLIENT_SECRET ||
      !process.env.NDI_WEBHOOK_CLIENT_SECRET
    ) {
      return res.status(401).json({ error: "invalid_client" });
    }

    res.json({
      access_token: process.env.NDI_WEBHOOK_CLIENT_SECRET,
      expires_in: 3600,
      token_type: "Bearer",
    });
  }),
);

ndiRouter.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    if (
      process.env.NDI_WEBHOOK_CLIENT_SECRET &&
      req.headers.authorization !== `Bearer ${process.env.NDI_WEBHOOK_CLIENT_SECRET}`
    ) {
      return res.sendStatus(401);
    }

    const event = normalizeNDIEvent(req.body);
    res.json({ ok: true, event });
  }),
);

ndiRouter.post(
  "/webhook/register",
  asyncHandler(async (_req, res) => {
    res.json(await registerWebhook());
  }),
);

ndiRouter.post(
  "/webhook/subscribe",
  asyncHandler(async (req, res) => {
    res.json(await subscribeWebhook(req.body.threadId));
  }),
);
