import cors from "cors";
import express from "express";
import { authRouter } from "./modules/auth/routes";
import { credentialRouter } from "./modules/credentials/routes";
import { employerRouter } from "./modules/employers/routes";
import { issuerRouter } from "./modules/issuers/routes";
import { jobsRouter } from "./modules/jobs/routes";
import { resumeRouter } from "./modules/resume/routes";

const app = express();
const port = Number(process.env.API_PORT ?? 4000);

app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "ndi-credential-chain-api" }));
app.use("/auth", authRouter);
app.use("/issuers", issuerRouter);
app.use("/credentials", credentialRouter);
app.use("/resume", resumeRouter);
app.use("/jobs", jobsRouter);
app.use("/employers", employerRouter);

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ code: "INVALID_REQUEST", message: error.message });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
