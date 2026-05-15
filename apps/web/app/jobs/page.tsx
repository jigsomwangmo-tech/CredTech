import Link from "next/link";
import { Card } from "@/components/ui/card";

const jobs = [
  { id: "1", title: "Blockchain Credential Analyst", company: "Druk Holding and Investments" },
  { id: "2", title: "Graduate Software Trainee", company: "Bhutan Digital Academy" },
];

export default function JobsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Job listings</h1>
      <div className="mt-6 grid gap-4">
        {jobs.map(job => (
          <Card key={job.id} className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{job.title}</h2>
              <p className="text-sm opacity-75">{job.company}</p>
            </div>
            <Link className="text-sm font-medium text-primary" href="/login">
              Apply with NDI
            </Link>
          </Card>
        ))}
      </div>
    </main>
  );
}
