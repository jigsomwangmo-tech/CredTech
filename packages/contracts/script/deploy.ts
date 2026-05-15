import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import artifact from "../out/CredentialRegistry.sol/CredentialRegistry.json" assert { type: "json" };

const rpcUrl = process.env.CHAIN_RPC_URL ?? "http://127.0.0.1:8545";
const privateKey = process.env.PRIVATE_KEY as `0x${string}` | undefined;

if (!privateKey) {
  throw new Error("PRIVATE_KEY is required to deploy CredentialRegistry");
}

const account = privateKeyToAccount(privateKey);
const transport = http(rpcUrl);
const walletClient = createWalletClient({ account, chain: foundry, transport });
const publicClient = createPublicClient({ chain: foundry, transport });

const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode.object as `0x${string}`,
});

const receipt = await publicClient.waitForTransactionReceipt({ hash });

console.log(`CredentialRegistry deployed at ${receipt.contractAddress}`);
