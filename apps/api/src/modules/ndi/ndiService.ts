import { randomUUID } from "node:crypto";
import type { ConsentScope, NDISession, SelectiveDisclosure, UserRole } from "@ndi/shared";
import { hashDID } from "../../lib/hash";

type LoginInput = {
  ndiToken?: string;
  role: UserRole;
  displayName: string;
};

export async function loginWithNDI(input: LoginInput): Promise<NDISession> {
  const did = input.ndiToken?.startsWith("did:bt:") ? input.ndiToken : `did:bt:mock:${randomUUID()}`;

  return {
    did,
    didHash: hashDID(did),
    verified: true,
    proofToken: `ndi-proof-${randomUUID()}`,
  };
}

export async function verifyNDIToken(proofToken: string) {
  return proofToken.startsWith("ndi-proof-");
}

export async function requestConsent(params: {
  holderDidHash: `0x${string}`;
  requesterDidHash: `0x${string}`;
  scopes: ConsentScope[];
  selectiveDisclosure: SelectiveDisclosure;
}) {
  return {
    requestId: randomUUID(),
    status: "pending" as const,
    ndiDeepLink: `ndi://consent?request=${encodeURIComponent(JSON.stringify(params.scopes))}`,
  };
}

export async function verifyConsentProof(proof: string) {
  return proof.startsWith("ndi-consent-approved:");
}

export async function getUserDID(proofToken: string) {
  if (!(await verifyNDIToken(proofToken))) {
    throw new Error("Invalid NDI proof token");
  }

  return `did:bt:mock:${proofToken.slice(-12)}`;
}
