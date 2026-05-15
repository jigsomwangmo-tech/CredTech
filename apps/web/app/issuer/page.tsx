import { Upload, BadgeX, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function IssuerDashboard() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Issuer dashboard</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card><Upload className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">Issue certificate</h2></Card>
        <Card><FileSpreadsheet className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">Batch upload</h2></Card>
        <Card><BadgeX className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">Revoke credentials</h2></Card>
      </div>
    </main>
  );
}
