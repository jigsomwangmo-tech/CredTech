"use client";

import Link from "next/link";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useCopyToClipboard } from "~~/hooks/scaffold-eth";
import {
  TEAM_ACCENT,
  TEAM_ACCENT_DARK,
  TEAM_MEMBERS,
  TEAM_NAME,
  TEAM_PROBLEM,
  TEAM_PROBLEM_EXPANDED,
  TEAM_SURFACE,
} from "~~/utils/team";

const Home: NextPage = () => {
  const { copyToClipboard } = useCopyToClipboard();

  return (
    <main className="min-h-screen" style={{ backgroundColor: TEAM_SURFACE }}>
      <section className="border-b border-stone-300/70">
        <div className="mx-auto grid min-h-[72vh] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: TEAM_ACCENT_DARK }}>
              Bhutan Workshop Multisig
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] text-stone-950 md:text-7xl">{TEAM_NAME}</h1>
            <p className="mt-7 max-w-3xl text-xl leading-8 text-stone-700 md:text-2xl">{TEAM_PROBLEM}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/wallet" className="btn border-0 px-7 text-white" style={{ backgroundColor: TEAM_ACCENT }}>
                Open the wallet
              </Link>
              <a
                href="https://sepolia.etherscan.io/address/0xb297d46dac4dB88877016cF70ada1539A6d647A0"
                className="btn border-stone-400 bg-transparent px-7 text-stone-800 hover:border-stone-700 hover:bg-stone-100"
                target="_blank"
                rel="noreferrer"
              >
                View on Sepolia
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-stone-300 bg-white/75 p-6 shadow-sm">
            <div className="grid gap-4">
              <div className="rounded-md border border-stone-200 bg-stone-50 p-5">
                <div className="text-sm font-medium uppercase tracking-[0.14em] text-stone-500">Threshold</div>
                <div className="mt-3 text-4xl font-semibold text-stone-950">3 of 5</div>
                <div className="mt-2 text-sm text-stone-600">Team approvals required for every wallet action.</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md border border-stone-200 bg-stone-50 p-5">
                  <div className="text-sm text-stone-500">Network</div>
                  <div className="mt-2 font-semibold text-stone-950">Sepolia</div>
                </div>
                <div className="rounded-md border border-stone-200 bg-stone-50 p-5">
                  <div className="text-sm text-stone-500">Contract</div>
                  <div className="mt-2 font-semibold text-stone-950">MultiSigWallet</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-stone-300 bg-white/70 p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-500">Signers</p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-950">Our team</h2>
            </div>
            <span className="rounded-full bg-teal-900 px-3 py-1 text-sm font-medium text-white">5 owners</span>
          </div>
          <div className="mt-5 grid gap-3">
            {TEAM_MEMBERS.map(member => (
              <button
                key={member.address}
                className="flex items-center justify-between rounded-md border border-stone-200 bg-white px-4 py-3 text-left transition hover:border-teal-700 hover:bg-teal-50"
                onClick={() => copyToClipboard(member.address)}
              >
                <span>
                  <span className="block font-semibold text-stone-950">
                    {member.name}
                    {member.deployer && (
                      <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700">
                        original deployer
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-stone-600">
                    <Address address={member.address} disableAddressLink size="sm" />
                  </span>
                </span>
                <ClipboardDocumentIcon className="h-5 w-5 shrink-0 text-stone-500" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-stone-300 bg-white/70 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-500">Purpose</p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-950">Why this wallet exists</h2>
          <p className="mt-5 text-lg leading-8 text-stone-700">{TEAM_PROBLEM_EXPANDED}</p>
          <div className="mt-7 grid gap-3 text-sm text-stone-700">
            <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
              Submit creates a proposed action for the team to review.
            </div>
            <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
              Approve records each signer&apos;s agreement on-chain.
            </div>
            <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
              Execute performs the action only after the threshold is met.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
