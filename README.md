# NDI Credential Chain

A full-stack hackathon scaffold for decentralized credential issuance, verification, and recruitment with Bhutan NDI as the central identity, authorization, consent, and trust layer.

Repository target: `https://github.com/jigsomwangmo-tech/CredTech.git`

## Stack

- Frontend: Next.js App Router, TypeScript, TailwindCSS, shadcn-style UI primitives
- API: Express.js, TypeScript, Bun
- Blockchain: Solidity `^0.8.x`, viem
- Database: PostgreSQL, Drizzle ORM
- Infrastructure: Docker and Docker Compose
- Authentication: mock Bhutan NDI SDK integration layer

## Structure

```txt
apps/
  api/          Express API with NDI, credentials, resume, jobs, employer modules
  web/          Next.js frontend
packages/
  contracts/    CredentialRegistry.sol and viem deployment script
  db/           Drizzle schema and database client
  shared/       Shared TypeScript types
docker/         Anvil Dockerfile
```

## NDI Rules

- Without NDI login, no user exists in the system.
- Without NDI DID hash, no blockchain action is valid.
- Without NDI consent, no holder credential or resume data is shared.
- Raw DIDs are never stored on-chain; the system uses `keccak256(abi.encodePacked(did))` style DID hashes.

## Bhutan NDI Integration

The API follows the staging NDI host split:

- OAuth token: `https://staging.bhutanndi.com/authentication/v1/authenticate`
- Verifier, issuer, and webhook APIs: `https://demo-client.bhutanndi.com`

Set `NDI_CLIENT_ID` and `NDI_CLIENT_SECRET` to enable real calls. Without them, the API returns mock proof URLs so the rest of the app can still run.

Implemented NDI pieces:

- OAuth2 `client_credentials` token cache with 5-minute early refresh.
- `POST /auth/ndi-login/start` creates a login proof request for `Full Name` and `ID Number`.
- `POST /auth/ndi-login/complete` accepts a validated proof payload and issues the app JWT.
- `POST /ndi/oauth/token` and `POST /ndi/webhook` support NDI webhook delivery.
- `POST /ndi/webhook/register` registers the webhook when public URLs are configured.
- Consent requests create verifier proof requests and subscribe the thread ID for webhook callbacks.

NDI proof payloads are normalized from the shared envelope shape. The app trusts `verification_result === "ProofValidated"` and reads revealed attributes defensively whether NDI returns an object or array.

## Setup

```bash
bun install
cp .env.example .env
docker compose up
```

In another terminal, push the database schema:

```bash
bun --filter @ndi/db push
```

Compile and deploy the contract when Foundry is available:

```bash
cd packages/contracts
forge build
bun run deploy
```

Set `CREDENTIAL_REGISTRY_ADDRESS` in `.env` and Docker Compose after deployment.

## Scripts

```bash
bun dev
bun test
bun lint
bun migrate
bun contracts:deploy
```

## API Modules

- `POST /auth/ndi-login`
- `POST /auth/ndi-login/start`
- `POST /auth/ndi-login/complete`
- `POST /auth/verify-consent`
- `POST /ndi/oauth/token`
- `POST /ndi/webhook`
- `POST /ndi/webhook/register`
- `POST /ndi/webhook/subscribe`
- `POST /issuers/register`
- `GET /issuers`
- `POST /credentials/issue`
- `POST /credentials/verify`
- `POST /credentials/revoke`
- `GET /credentials/:id`
- `POST /resume/create`
- `PATCH /resume/update`
- `POST /resume/request-consent`
- `GET /resume/:holderId`
- `POST /resume/gpa`
- `POST /jobs/create`
- `GET /jobs`
- `PATCH /jobs/:id`
- `DELETE /jobs/:id`
- `POST /jobs/:id/apply`
- `GET /jobs/:id/applicants`
- `POST /employers/request-verification`
- `POST /employers/verify-candidate`

## Frontend Pages

- `/` landing page
- `/verify` certificate verifier
- `/verify/[credentialId]` QR verification target
- `/jobs` job listings
- `/login` mock NDI login
- `/issuer` issuer dashboard
- `/holder` holder dashboard
- `/employer` employer dashboard

## Notes

The NDI integration is intentionally isolated in `apps/api/src/modules/ndi` and re-exported from `apps/api/src/services/ndiService.ts`, so a real Bhutan NDI SDK can replace the mock without changing the rest of the app.
