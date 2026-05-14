"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Address as AddressDisplay } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { Abi, Address, encodeFunctionData, formatEther, isAddress, parseEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import {
  useCopyToClipboard,
  useDeployedContractInfo,
  useScaffoldEventHistory,
  useScaffoldReadContract,
  useScaffoldWriteContract,
  useTargetNetwork,
} from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { TEAM_ACCENT, TEAM_ACCENT_DARK, TEAM_MEMBERS, TEAM_NAME, TEAM_SURFACE } from "~~/utils/team";

type MultiSigTransaction = {
  to: Address;
  value: bigint;
  data: `0x${string}`;
  executed: boolean;
  numConfirmations: bigint;
};

const normalize = (address?: string) => address?.toLowerCase();

const memberName = (address: string) =>
  TEAM_MEMBERS.find(member => normalize(member.address) === normalize(address))?.name || "Team signer";

const parseCalldata = (value: string): `0x${string}` => {
  const cleaned = value.trim();
  return cleaned ? (cleaned as `0x${string}`) : "0x";
};

const TransactionRow = ({
  index,
  threshold,
  walletAddress,
  executedHashes,
}: {
  index: number;
  threshold: bigint;
  walletAddress?: Address;
  executedHashes: Record<string, `0x${string}`>;
}) => {
  const { writeContractAsync, isMining } = useScaffoldWriteContract({ contractName: "MultiSigWallet" });
  const { targetNetwork } = useTargetNetwork();
  const { data: transaction, refetch } = useScaffoldReadContract({
    contractName: "MultiSigWallet",
    functionName: "getTransaction",
    args: [BigInt(index)],
  });

  const tx = transaction as MultiSigTransaction | undefined;
  const approvals = tx?.numConfirmations || 0n;
  const canExecute = Boolean(tx && !tx.executed && approvals >= threshold);
  const explorerTx = executedHashes[index.toString()];

  const run = async (functionName: "approveTransaction" | "revokeApproval" | "executeTransaction") => {
    await writeContractAsync(
      { functionName, args: [BigInt(index)] },
      {
        onBlockConfirmation: () => {
          refetch();
        },
      },
    );
  };

  if (!tx) return null;

  return (
    <div className="rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-stone-950">Transaction #{index}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <span>target</span>
            <AddressDisplay address={tx.to} chain={targetNetwork} size="sm" />
            {walletAddress && normalize(tx.to) === normalize(walletAddress) && (
              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700">
                self-call
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-stone-600">value {formatEther(tx.value)} ETH</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-900">
            {approvals.toString()}/{threshold.toString()} approvals
          </span>
          {tx.executed ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              executed
            </span>
          ) : (
            <>
              <button className="btn btn-sm" disabled={isMining} onClick={() => run("approveTransaction")}>
                approve
              </button>
              <button className="btn btn-sm btn-outline" disabled={isMining} onClick={() => run("revokeApproval")}>
                revoke
              </button>
              <button
                className="btn btn-sm border-0 text-white"
                style={{ backgroundColor: TEAM_ACCENT }}
                disabled={!canExecute || isMining}
                onClick={() => run("executeTransaction")}
              >
                execute
              </button>
            </>
          )}
        </div>
      </div>
      {tx.data !== "0x" && <div className="mt-3 break-all rounded bg-stone-100 p-2 text-xs">calldata {tx.data}</div>}
      {explorerTx && (
        <Link
          className="link mt-3 block text-sm"
          href={`${targetNetwork.blockExplorers?.default.url}/tx/${explorerTx}`}
          target="_blank"
        >
          view execution transaction
        </Link>
      )}
    </div>
  );
};

const Wallet: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { copyToClipboard } = useCopyToClipboard();
  const { targetNetwork } = useTargetNetwork();
  const { data: deployedContract } = useDeployedContractInfo({ contractName: "MultiSigWallet" });
  const { writeContractAsync, isMining } = useScaffoldWriteContract({ contractName: "MultiSigWallet" });

  const [recipient, setRecipient] = useState("");
  const [ethValue, setEthValue] = useState("0");
  const [calldata, setCalldata] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [removeAddress, setRemoveAddress] = useState("");
  const [newThreshold, setNewThreshold] = useState("3");

  const walletAddress = deployedContract?.address;
  const { data: balance } = useBalance({ address: walletAddress, chainId: targetNetwork.id });
  const { data: owners, refetch: refetchOwners } = useScaffoldReadContract({
    contractName: "MultiSigWallet",
    functionName: "getOwners",
  });
  const { data: threshold, refetch: refetchThreshold } = useScaffoldReadContract({
    contractName: "MultiSigWallet",
    functionName: "threshold",
  });
  const { data: transactionCount, refetch: refetchTransactionCount } = useScaffoldReadContract({
    contractName: "MultiSigWallet",
    functionName: "getTransactionCount",
  });
  const { data: executedEvents } = useScaffoldEventHistory({
    contractName: "MultiSigWallet",
    eventName: "TransactionExecuted",
    watch: true,
    enabled: Boolean(walletAddress),
    blocksBatchSize: 2_000,
  });

  const ownerList = (owners || []) as Address[];
  const currentThreshold = (threshold || 0n) as bigint;
  const txCount = Number(transactionCount || 0n);
  const indices = useMemo(() => Array.from({ length: txCount }, (_, index) => index).reverse(), [txCount]);
  const executedHashes = useMemo(
    () =>
      (executedEvents || []).reduce<Record<string, `0x${string}`>>((acc, event: any) => {
        acc[event.args.txIndex.toString()] = event.transactionHash;
        return acc;
      }, {}),
    [executedEvents],
  );

  const afterWrite = () => {
    refetchOwners();
    refetchThreshold();
    refetchTransactionCount();
  };

  const submitTransaction = async (event: FormEvent) => {
    event.preventDefault();
    if (!isAddress(recipient)) {
      notification.error("Recipient must be a valid address");
      return;
    }

    await writeContractAsync(
      {
        functionName: "submitTransaction",
        args: [recipient as Address, parseEther(ethValue || "0"), parseCalldata(calldata)],
      },
      { onBlockConfirmation: afterWrite },
    );
  };

  const submitSelfCall = async (
    functionName: "addOwner" | "removeOwner" | "changeThreshold",
    args: readonly unknown[],
  ) => {
    if (!walletAddress || !deployedContract?.abi) {
      notification.error("Deploy MultiSigWallet first");
      return;
    }

    const data = encodeFunctionData({
      abi: deployedContract.abi as Abi,
      functionName,
      args,
    });

    await writeContractAsync(
      {
        functionName: "submitTransaction",
        args: [walletAddress, 0n, data],
      },
      { onBlockConfirmation: afterWrite },
    );
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: TEAM_SURFACE }}>
      <header className="border-b border-stone-300 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: TEAM_ACCENT_DARK }}>
              {TEAM_NAME} multisig
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-950">Wallet dashboard</h1>
          </div>
          <Link href="/" className="btn btn-sm border-stone-400 bg-transparent text-stone-800 hover:border-stone-700">
            about
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8">
        <section className="rounded-lg border border-stone-300 bg-white/80 p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-left">
              <div className="text-sm font-semibold uppercase tracking-[0.12em] text-stone-500">Wallet address</div>
              <div className="mt-1 flex items-center gap-2">
                {walletAddress ? (
                  <AddressDisplay address={walletAddress} chain={targetNetwork} />
                ) : (
                  <span>Deploy MultiSigWallet first</span>
                )}
                <button
                  className="btn btn-ghost btn-xs"
                  disabled={!walletAddress}
                  type="button"
                  onClick={() => walletAddress && copyToClipboard(walletAddress)}
                >
                  <ClipboardDocumentIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <button
              className="text-left"
              disabled={!balance}
              onClick={() => balance && copyToClipboard(balance.formatted)}
            >
              <div className="text-sm font-semibold uppercase tracking-[0.12em] text-stone-500">ETH balance</div>
              <div className="mt-2 text-3xl font-semibold text-stone-950">
                {balance ? `${Number(balance.formatted).toFixed(6)} ETH` : "0 ETH"}
              </div>
            </button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-stone-300 bg-white/80 p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-stone-950">Current owners</h2>
            <div className="mt-2 text-stone-600">
              {currentThreshold.toString()} of {ownerList.length} approvals required
            </div>
            <div className="mt-4 grid gap-3">
              {ownerList.map(owner => (
                <div key={owner} className="rounded-md border border-stone-200 bg-white p-3">
                  <div className="font-semibold text-stone-950">{memberName(owner)}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <AddressDisplay address={owner} chain={targetNetwork} size="sm" />
                    {normalize(owner) === normalize(connectedAddress) && (
                      <span className="rounded-full bg-teal-900 px-2 py-0.5 text-xs font-medium text-white">you</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form className="rounded-lg border border-stone-300 bg-white/80 p-5 shadow-sm" onSubmit={submitTransaction}>
            <h2 className="text-xl font-semibold text-stone-950">New transaction</h2>
            <div className="mt-4 grid gap-3">
              <input
                className="input input-bordered w-full bg-white"
                autoComplete="off"
                placeholder="recipient address"
                suppressHydrationWarning
                value={recipient}
                onChange={event => setRecipient(event.target.value)}
              />
              <input
                className="input input-bordered w-full bg-white"
                autoComplete="off"
                placeholder="ETH value"
                suppressHydrationWarning
                value={ethValue}
                onChange={event => setEthValue(event.target.value)}
              />
              <textarea
                className="textarea textarea-bordered min-h-24 w-full bg-white font-mono text-sm"
                placeholder="optional calldata, 0x..."
                value={calldata}
                onChange={event => setCalldata(event.target.value)}
              />
              <button
                className="btn border-0 text-white"
                style={{ backgroundColor: TEAM_ACCENT }}
                disabled={isMining}
                suppressHydrationWarning
              >
                submit
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-stone-300 bg-white/80 p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-950">Owner controls</h2>
          <p className="mt-1 text-sm text-stone-600">
            Ownership changes are submitted as wallet self-calls, so they follow the same approval flow.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className="grid gap-2">
              <input
                className="input input-bordered w-full bg-white"
                autoComplete="off"
                placeholder="new owner address"
                suppressHydrationWarning
                value={ownerAddress}
                onChange={event => setOwnerAddress(event.target.value)}
              />
              <button
                className="btn btn-outline"
                disabled={!isAddress(ownerAddress) || isMining}
                onClick={() => submitSelfCall("addOwner", [ownerAddress])}
                suppressHydrationWarning
              >
                submit add owner
              </button>
            </div>
            <div className="grid gap-2">
              <input
                className="input input-bordered w-full bg-white"
                autoComplete="off"
                placeholder="owner to remove"
                suppressHydrationWarning
                value={removeAddress}
                onChange={event => setRemoveAddress(event.target.value)}
              />
              <button
                className="btn btn-outline"
                disabled={!isAddress(removeAddress) || isMining}
                onClick={() => submitSelfCall("removeOwner", [removeAddress])}
                suppressHydrationWarning
              >
                submit remove owner
              </button>
            </div>
            <div className="grid gap-2">
              <input
                className="input input-bordered w-full bg-white"
                autoComplete="off"
                placeholder="threshold"
                suppressHydrationWarning
                value={newThreshold}
                onChange={event => setNewThreshold(event.target.value)}
              />
              <button
                className="btn btn-outline"
                disabled={!Number(newThreshold) || isMining}
                onClick={() => submitSelfCall("changeThreshold", [BigInt(newThreshold || "0")])}
                suppressHydrationWarning
              >
                submit threshold
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-stone-300 bg-white/80 p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-950">Pending transactions</h2>
          <div className="mt-4 grid gap-3">
            {indices.filter(index => !executedHashes[index.toString()]).length === 0 && (
              <div className="rounded-md border border-dashed border-stone-300 p-4 text-stone-500">
                No pending transactions.
              </div>
            )}
            {indices
              .filter(index => !executedHashes[index.toString()])
              .map(index => (
                <TransactionRow
                  key={index}
                  index={index}
                  threshold={currentThreshold}
                  walletAddress={walletAddress}
                  executedHashes={executedHashes}
                />
              ))}
          </div>
        </section>

        <section className="rounded-lg border border-stone-300 bg-white/80 p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-950">Executed transactions</h2>
          <div className="mt-4 grid gap-3">
            {Object.entries(executedHashes).length === 0 && (
              <div className="rounded-md border border-dashed border-stone-300 p-4 text-stone-500">
                No executed transactions yet.
              </div>
            )}
            {Object.entries(executedHashes).map(([index, hash]) => (
              <Link
                key={hash}
                className="link break-all"
                href={`${targetNetwork.blockExplorers?.default.url}/tx/${hash}`}
                target="_blank"
              >
                Transaction #{index}: {hash}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Wallet;
