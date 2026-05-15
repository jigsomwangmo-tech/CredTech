import { FileCheck2, GitPullRequestArrow, GraduationCap, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function HolderDashboard() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Holder dashboard</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card><FileCheck2 className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">My credentials</h2></Card>
        <Card><GraduationCap className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">Build resume</h2></Card>
        <Card><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">Consent</h2></Card>
        <Card><GitPullRequestArrow className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">GPA converter</h2></Card>
      </div>
    </main>
  );
}
