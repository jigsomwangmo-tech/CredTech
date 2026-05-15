export type UserRole = "issuer" | "holder" | "employer" | "admin";

export type CredentialType = "EDUCATION" | "EMPLOYMENT" | "WORKSHOP" | "LICENSE" | "OTHER";

export type NDISession = {
  did: string;
  didHash: `0x${string}`;
  verified: boolean;
  proofToken: string;
};

export type ConsentScope = "education" | "employment" | "certificate" | "resume" | "gpa";

export type SelectiveDisclosure = {
  allowedFields: string[];
  hiddenFields: string[];
};

export type ApiErrorCode =
  | "ACCESS_DENIED_NDI_CONSENT_REQUIRED"
  | "NDI_LOGIN_REQUIRED"
  | "NDI_DID_HASH_REQUIRED"
  | "INVALID_REQUEST"
  | "NOT_FOUND";
