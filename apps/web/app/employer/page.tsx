import { BarChart3, BriefcaseBusiness, ShieldCheck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function EmployerDashboard() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Employer dashboard</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card><BriefcaseBusiness className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">Post jobs</h2></Card>
        <Card><Users className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">Applicants</h2></Card>
        <Card><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">Verify candidate</h2></Card>
        <Card><BarChart3 className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">Analytics</h2></Card>
      </div>
    </main>
  );
}
