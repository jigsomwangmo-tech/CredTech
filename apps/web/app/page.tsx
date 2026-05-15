import Link from "next/link";
import { BadgeCheck, BriefcaseBusiness, FileCheck2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  { title: "NDI-first identity", icon: ShieldCheck, text: "Every issuer, holder, and employer starts from verified Bhutan NDI login." },
  { title: "On-chain credentials", icon: BadgeCheck, text: "Certificate hashes and DID hashes anchor trust without exposing raw identity data." },
  { title: "Consent sharing", icon: FileCheck2, text: "Employers only receive fields approved through NDI consent proofs." },
  { title: "Recruitment workflows", icon: BriefcaseBusiness, text: "Jobs, applications, resumes, GPA conversion, and verification in one flow." },
];

export default function Home() {
  return (
    <main>
      <section className="border-b border-border">
        <div className="mx-auto grid min-h-[72vh] max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Bhutan NDI trust layer</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-none md:text-7xl">NDI Credential Chain</h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 opacity-80">
              Issue tamper-proof credentials, build consent-based resumes, and verify candidates instantly with NDI-backed privacy.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login">
                <Button>Login with NDI</Button>
              </Link>
              <Link href="/verify">
                <Button variant="outline">Verify certificate</Button>
              </Link>
            </div>
          </div>
          <Card className="grid gap-4">
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm opacity-70">Issuer control</p>
              <p className="mt-2 text-3xl font-semibold">NDI registered only</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm opacity-70">Privacy</p>
                <p className="mt-2 font-semibold">Hashed DID</p>
              </div>
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm opacity-70">Sharing</p>
                <p className="mt-2 font-semibold">Consent proof</p>
              </div>
            </div>
          </Card>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-10 md:grid-cols-4">
        {features.map(feature => (
          <Card key={feature.title}>
            <feature.icon className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 opacity-75">{feature.text}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
