import { randomUUID } from "node:crypto";
import type { ConsentScope, NDISession, SelectiveDisclosure, UserRole } from "@ndi/shared";
import { hashDID } from "../../lib/hash";

type NDIPurpose = "login" | "ekyc" | "ekyc_update";

type LoginInput = {
  ndiToken?: string;
  role: UserRole;
  displayName: string;
  proofPayload?: unknown;
};

type NDIProofAttribute = {
  name: string;
  restrictions: Array<Record<string, string>>;
};

type NDIProofRequestInput = {
  proofName: string;
  attributes: string[];
  purpose: NDIPurpose;
  authenticationLevel?: "Standard" | string;
  schemaName?: string;
};

type NDIProofRequestResponse = {
  proofRequestThreadId: string;
  deepLinkURL: string;
  proofRequestURL: string;
};

export type NormalizedNDIProof = {
  threadId?: string;
  type?: string;
  verificationResult?: string;
  holderDID?: string;
  relationshipDID?: string;
  revealedAttributes: Record<string, string>;
  raw: unknown;
};

let tokenCache: { token: string; expiresAt: number } | null = null;

const authBaseUrl = process.env.NDI_AUTH_BASE_URL ?? "https://staging.bhutanndi.com";
const apiBaseUrl = process.env.NDI_API_BASE_URL ?? "https://demo-client.bhutanndi.com";
const defaultSchemaName = process.env.NDI_DEFAULT_SCHEMA_NAME ?? "https://dev-schema.ngotag.com/schemas/foundational-id";

function ndiConfigured() {
  return Boolean(process.env.NDI_CLIENT_ID && process.env.NDI_CLIENT_SECRET);
}

async function fetchNDIToken() {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  if (!ndiConfigured()) {
    return `mock-token-${randomUUID()}`;
  }

  const body = new URLSearchParams({
    client_id: process.env.NDI_CLIENT_ID!,
    client_secret: process.env.NDI_CLIENT_SECRET!,
    grant_type: "client_credentials",
  });

  const response = await fetch(`${authBaseUrl}/authentication/v1/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`NDI auth failed: ${response.status} ${await response.text()}`);
  }

  const json = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in - 300) * 1000,
  };

  return tokenCache.token;
}

export function pickRevealedValue(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0]?.value === "string" ? value[0].value : undefined;
  }

  if (typeof value === "object" && value && "value" in value) {
    const attr = value as { value?: unknown };
    return typeof attr.value === "string" ? attr.value : undefined;
  }

  return undefined;
}

export function normalizeNDIEvent(payload: unknown): NormalizedNDIProof {
  const envelope = payload as {
    pattern?: string;
    data?: Record<string, unknown>;
  };
  const inner = envelope?.data?.type || envelope?.data?.thid ? envelope.data : (payload as Record<string, unknown>);
  const requestedPresentation = inner?.requested_presentation as { revealed_attrs?: Record<string, unknown> } | undefined;
  const revealedAttrs = requestedPresentation?.revealed_attrs ?? {};

  return {
    threadId: envelope?.pattern ?? (inner?.thid as string | undefined),
    type: inner?.type as string | undefined,
    verificationResult: inner?.verification_result as string | undefined,
    holderDID: inner?.holder_did as string | undefined,
    relationshipDID: (inner?.relationship_did ?? inner?.relationshipDid) as string | undefined,
    revealedAttributes: Object.fromEntries(
      Object.entries(revealedAttrs)
        .map(([key, value]) => [key, pickRevealedValue(value)])
        .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    ),
    raw: payload,
  };
}

export async function createProofRequest(input: NDIProofRequestInput): Promise<NDIProofRequestResponse> {
  if (!ndiConfigured()) {
    const threadId = randomUUID();

    return {
      proofRequestThreadId: threadId,
      deepLinkURL: `bhutanndidemo://data?threadId=${threadId}`,
      proofRequestURL: `${process.env.WEB_ORIGIN ?? "http://localhost:3000"}/login?ndiThreadId=${threadId}`,
    };
  }

  const token = await fetchNDIToken();
  const proofAttributes: NDIProofAttribute[] = input.attributes.map(name => ({
    name,
    restrictions: [{ schema_name: input.schemaName ?? defaultSchemaName }],
  }));

  const response = await fetch(`${apiBaseUrl}/verifier/v1/proof-request`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      proofName: input.proofName,
      proofAttributes,
      purpose: input.purpose,
      authenticationLevel: input.authenticationLevel ?? "Standard",
      isShortenUrl: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`NDI proof request failed: ${response.status} ${await response.text()}`);
  }

  const json = (await response.json()) as { data: NDIProofRequestResponse };
  return json.data;
}

export async function loginWithNDI(input: LoginInput): Promise<NDISession> {
  if (input.proofPayload) {
    const proof = normalizeNDIEvent(input.proofPayload);
    if (proof.verificationResult !== "ProofValidated" || !proof.holderDID) {
      throw new Error("NDI login proof was not validated");
    }

    return {
      did: proof.holderDID,
      didHash: hashDID(proof.holderDID),
      verified: true,
      proofToken: `ndi-proof:${proof.threadId ?? randomUUID()}`,
    };
  }

  const did = input.ndiToken?.startsWith("did:bt:") ? input.ndiToken : `did:bt:mock:${randomUUID()}`;

  return {
    did,
    didHash: hashDID(did),
    verified: true,
    proofToken: `ndi-proof-${randomUUID()}`,
  };
}

export async function verifyNDIToken(proofToken: string) {
  return proofToken.startsWith("ndi-proof");
}

export async function requestConsent(params: {
  holderDidHash: `0x${string}`;
  requesterDidHash: `0x${string}`;
  scopes: ConsentScope[];
  selectiveDisclosure: SelectiveDisclosure;
}) {
  const attributes = params.scopes.flatMap(scope => {
    if (scope === "education") return ["Full Name", "ID Number"];
    if (scope === "employment") return ["Full Name"];
    if (scope === "certificate") return ["Full Name", "ID Number"];
    return ["Full Name"];
  });
  const proof = await createProofRequest({
    proofName: "Credential verification consent",
    attributes: [...new Set(attributes)],
    purpose: "ekyc",
  });

  return {
    requestId: proof.proofRequestThreadId,
    status: "pending" as const,
    proofRequestThreadId: proof.proofRequestThreadId,
    deepLinkURL: proof.deepLinkURL,
    proofRequestURL: proof.proofRequestURL,
    ndiDeepLink: proof.deepLinkURL,
  };
}

export async function verifyConsentProof(proof: string) {
  if (proof.startsWith("ndi-consent-approved:")) return true;

  try {
    const normalized = normalizeNDIEvent(JSON.parse(proof));
    return normalized.verificationResult === "ProofValidated";
  } catch {
    return false;
  }
}

export async function getUserDID(proofToken: string) {
  if (!(await verifyNDIToken(proofToken))) {
    throw new Error("Invalid NDI proof token");
  }

  return `did:bt:mock:${proofToken.slice(-12)}`;
}

export async function registerWebhook() {
  if (!ndiConfigured() || !process.env.NDI_WEBHOOK_ID || !process.env.NDI_WEBHOOK_URL) {
    return { skipped: true };
  }

  const token = await fetchNDIToken();
  const response = await fetch(`${apiBaseUrl}/webhook/v1/register`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      webhookId: process.env.NDI_WEBHOOK_ID,
      webhookURL: process.env.NDI_WEBHOOK_URL,
      authentication: {
        type: "OAuth2",
        version: "v1",
        data: {
          url: process.env.NDI_WEBHOOK_OAUTH_URL,
          grant_type: "client_credentials",
          client_id: process.env.NDI_WEBHOOK_CLIENT_ID,
          client_secret: process.env.NDI_WEBHOOK_CLIENT_SECRET,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`NDI webhook register failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

export async function subscribeWebhook(threadId: string) {
  if (!ndiConfigured() || !process.env.NDI_WEBHOOK_ID) {
    return { skipped: true };
  }

  const token = await fetchNDIToken();
  const response = await fetch(`${apiBaseUrl}/webhook/v1/subscribe`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ webhookId: process.env.NDI_WEBHOOK_ID, threadId }),
  });

  if (!response.ok) {
    throw new Error(`NDI webhook subscribe failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}
