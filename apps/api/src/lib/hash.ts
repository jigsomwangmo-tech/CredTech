import { createHash } from "node:crypto";
import { encodePacked, keccak256, stringToHex } from "viem";

export function sha256Buffer(buffer: Buffer) {
  return `0x${createHash("sha256").update(buffer).digest("hex")}` as `0x${string}`;
}

export function hashDID(did: string) {
  return keccak256(encodePacked(["bytes"], [stringToHex(did)]));
}

export function createCredentialId(documentHash: `0x${string}`, holderDIDHash: `0x${string}`) {
  return keccak256(encodePacked(["bytes32", "bytes32", "uint256"], [documentHash, holderDIDHash, BigInt(Date.now())]));
}
