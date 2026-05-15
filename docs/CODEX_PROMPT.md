# Codex Build Prompt

Build **NDI Credential Chain** in `https://github.com/jigsomwangmo-tech/CredTech.git`.

Use the full-stack scope from the project README and treat Bhutan NDI as the mandatory central identity layer.

## NDI Core Integration Spec

All users, including issuers, holders, and employers, must authenticate through NDI. Without NDI login, no user exists in the system. Without NDI consent, no holder credential or resume data can be shared. Without an NDI DID hash, no blockchain action is valid.

Create the API identity module at:

```txt
apps/api/src/modules/ndi
```

Create the service abstraction at:

```txt
apps/api/src/services/ndiService.ts
```

It must expose:

```ts
loginWithNDI()
verifyNDIToken()
requestConsent()
verifyConsentProof()
getUserDID()
```

## Login Flow

1. User clicks "Login with NDI".
2. Backend authenticates to `https://staging.bhutanndi.com/authentication/v1/authenticate` using OAuth2 `client_credentials`.
3. Backend creates a verifier proof request at `https://demo-client.bhutanndi.com/verifier/v1/proof-request`.
4. Frontend renders `proofRequestURL` as a QR code and `deepLinkURL` as the mobile wallet link.
5. NDI returns the proof result asynchronously over webhook or NATS.
6. Backend accepts only `verification_result === "ProofValidated"`.
7. Backend hashes `holder_did` and issues a JWT session.

## DID Hashing

Never store raw DID on-chain. Store DID hashes using:

```ts
keccak256(abi.encodePacked(did))
```

Store `holderDIDHash` and, where useful, `issuerDIDHash`.

## Consent Flow

1. Employer requests education verification, employment history, or certificate access.
2. System creates a Bhutan NDI verifier proof request with schema restrictions.
3. Holder approves in the NDI wallet.
4. NDI returns a proof envelope by webhook or NATS.
5. Backend normalizes `data.requested_presentation.revealed_attrs`, verifies `ProofValidated`, and only then shares selected data.

If no consent exists, return:

```txt
ACCESS_DENIED_NDI_CONSENT_REQUIRED
```

## Selective Disclosure

Holders must choose which credentials and fields are shared. Degree and certificate validity may be shared while sensitive identity numbers or full marksheets remain hidden.

## Smart Contract Enforcement

The `CredentialRegistry.sol` contract must include:

```solidity
mapping(address => bool) public ndiIssuerRegistry;
mapping(address => bytes32) public holderDIDHash;
mapping(address => bytes32) public ndiLinkedDID;
```

Only NDI-approved issuers with linked DID hashes can issue credentials. Reject unknown issuers.

## Issuer Registration

1. Issuer logs in through NDI.
2. Backend extracts DID.
3. DID is hashed.
4. Owner registers the issuer wallet and DID hash on-chain.

NDI is the identity layer, authorization layer, consent layer, and issuer trust anchor.

## NDI Transport Notes

- Auth lives on `staging.bhutanndi.com`; verifier, issuer, and webhook APIs live on `demo-client.bhutanndi.com`.
- `proofAttributes[].name` is case-sensitive.
- Always include `restrictions[].schema_name` to prevent self-attested data from satisfying the proof.
- `purpose` must be `login`, `ekyc`, or `ekyc_update`.
- Revealed attributes can arrive as arrays or objects; normalize both.
- Do not poll for revealed attributes. Polling can show status, but attributes arrive by webhook or NATS.
