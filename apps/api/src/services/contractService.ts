import { createPublicClient, createWalletClient, getContract, http, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

const credentialRegistryAbi = [
  {
    type: "function",
    name: "registerIssuer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "issuer", type: "address" },
      { name: "issuerDIDHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "issueCredential",
    stateMutability: "nonpayable",
    inputs: [
      { name: "credentialId", type: "bytes32" },
      { name: "documentHash", type: "bytes32" },
      { name: "holderDIDHash", type: "bytes32" },
      { name: "credentialType", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "verifyCredential",
    stateMutability: "view",
    inputs: [{ name: "credentialId", type: "bytes32" }],
    outputs: [
      { name: "valid", type: "bool" },
      { name: "issuer", type: "address" },
      { name: "credentialType", type: "uint8" },
      { name: "issuedAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "revokeCredential",
    stateMutability: "nonpayable",
    inputs: [{ name: "credentialId", type: "bytes32" }],
    outputs: [],
  },
] as const;

function getClients() {
  const rpcUrl = process.env.CHAIN_RPC_URL ?? "http://127.0.0.1:8545";
  const privateKey = process.env.PRIVATE_KEY as Hex | undefined;
  const address = process.env.CREDENTIAL_REGISTRY_ADDRESS as Address | undefined;

  if (!privateKey || !address) {
    return null;
  }

  const account = privateKeyToAccount(privateKey);
  const transport = http(rpcUrl);
  const publicClient = createPublicClient({ chain: foundry, transport });
  const walletClient = createWalletClient({ account, chain: foundry, transport });
  const contract = getContract({ address, abi: credentialRegistryAbi, client: { public: publicClient, wallet: walletClient } });

  return { contract, publicClient, walletClient, account };
}

export async function registerIssuerOnchain(issuer: Address, issuerDIDHash: Hex) {
  const clients = getClients();
  if (!clients) return { txHash: null, skipped: true };

  const txHash = await clients.contract.write.registerIssuer([issuer, issuerDIDHash], { account: clients.account });
  return { txHash, skipped: false };
}

export async function issueCredentialOnchain(args: {
  credentialId: Hex;
  documentHash: Hex;
  holderDIDHash: Hex;
  credentialType: number;
}) {
  const clients = getClients();
  if (!clients) return { txHash: null, skipped: true };

  const txHash = await clients.contract.write.issueCredential(
    [args.credentialId, args.documentHash, args.holderDIDHash, args.credentialType],
    { account: clients.account },
  );
  return { txHash, skipped: false };
}

export async function verifyCredentialOnchain(credentialId: Hex) {
  const clients = getClients();
  if (!clients) return { valid: true, issuer: null, credentialType: 0, issuedAt: 0n, skipped: true };

  const [valid, issuer, credentialType, issuedAt] = await clients.contract.read.verifyCredential([credentialId]);
  return { valid, issuer, credentialType, issuedAt, skipped: false };
}

export async function revokeCredentialOnchain(credentialId: Hex) {
  const clients = getClients();
  if (!clients) return { txHash: null, skipped: true };

  const txHash = await clients.contract.write.revokeCredential([credentialId], { account: clients.account });
  return { txHash, skipped: false };
}
