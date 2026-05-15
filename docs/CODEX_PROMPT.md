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
2. Backend redirects or starts an NDI authentication request.
3. NDI returns user DID, verification status, and session proof token.
4. Backend validates the token.
5. Backend issues a JWT session.

## DID Hashing

Never store raw DID on-chain. Store DID hashes using:

```ts
keccak256(abi.encodePacked(did))
```

Store `holderDIDHash` and, where useful, `issuerDIDHash`.

## Consent Flow

1. Employer requests education verification, employment history, or certificate access.
2. System sends an NDI consent request to the holder.
3. Holder approves in the NDI app.
4. NDI returns a signed consent proof.
5. Backend verifies the consent proof before sharing any data.

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
