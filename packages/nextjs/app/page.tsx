"use client";

import Link from "next/link";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useCopyToClipboard } from "~~/hooks/scaffold-eth";
import { TEAM_ACCENT, TEAM_MEMBERS, TEAM_NAME, TEAM_PROBLEM, TEAM_PROBLEM_EXPANDED } from "~~/utils/team";

const Home: NextPage = () => {
  const { copyToClipboard } = useCopyToClipboard();

  return (
    <main className="min-h-screen bg-base-100">
      <section className="border-b border-base-300">
        <div className="mx-auto flex min-h-[58vh] max-w-6xl flex-col justify-center px-6 py-16">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: TEAM_ACCENT }}>
            Bhutan Workshop Multisig
          </p>
          <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">{TEAM_NAME}</h1>
          <p className="mt-6 max-w-3xl text-xl text-base-content/75 md:text-2xl">{TEAM_PROBLEM}</p>
          <div className="mt-10">
            <Link href="/wallet" className="btn text-white" style={{ backgroundColor: TEAM_ACCENT }}>
              open the wallet
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 className="text-2xl font-bold">Our team</h2>
          <div className="mt-5 grid gap-3">
            {TEAM_MEMBERS.map(member => (
              <button
                key={member.address}
                className="flex items-center justify-between rounded-lg border border-base-300 bg-base-200 px-4 py-3 text-left transition hover:border-base-content/30"
                onClick={() => copyToClipboard(member.address)}
              >
                <span>
                  <span className="block font-semibold">
                    {member.name}
                    {member.deployer && <span className="badge badge-sm ml-2">deployer</span>}
                  </span>
                  <span className="mt-1 block text-sm text-base-content/70">
                    <Address address={member.address} disableAddressLink size="sm" />
                  </span>
                </span>
                <ClipboardDocumentIcon className="h-5 w-5 shrink-0 text-base-content/60" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <h2 className="text-2xl font-bold">Why this wallet exists</h2>
          <p className="mt-4 text-lg leading-8 text-base-content/75">{TEAM_PROBLEM_EXPANDED}</p>
        </div>
      </section>
    </main>
  );
};

export default Home;
