"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { FileCheck2, Loader2, QrCode, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Job = {
  id: string;
  title: string;
  description: string;
  requirements: string[];
};

type ApplicationResult = {
  application: {
    id: string;
    jobId: string;
    status: string;
    verificationSummary: {
      applicantName?: string;
      applicantEmail?: string;
      result?: string;
      documents?: Record<string, { fileName: string; sha256: string }>;
    };
  };
  ndiProof: {
    proofRequestThreadId: string;
    proofRequestURL: string;
    deepLinkURL: string;
    qrDataUrl: string;
  };
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);
  const [result, setResult] = useState<ApplicationResult | null>(null);
  const [applicants, setApplicants] = useState<ApplicationResult["application"][]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${apiUrl}/jobs`)
      .then(response => response.json())
      .then(setJobs)
      .catch(console.error);
  }, []);

  async function refreshApplicants(jobId: string) {
    const response = await fetch(`${apiUrl}/jobs/${jobId}/applicants`);
    setApplicants(await response.json());
  }

  async function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedJob || !cv || !certificate) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("applicantName", applicantName);
    formData.append("applicantEmail", applicantEmail);
    formData.append("cv", cv);
    formData.append("certificate", certificate);

    const response = await fetch(`${apiUrl}/jobs/${selectedJob.id}/apply-demo`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setResult(data);
    await refreshApplicants(selectedJob.id);
    setLoading(false);
  }

  async function approveDemo() {
    if (!result) return;

    const response = await fetch(`${apiUrl}/jobs/applications/${result.application.id}/ndi-approve-demo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ consentProof: "ndi-consent-approved:demo" }),
    });
    const data = await response.json();
    setResult({ ...result, application: data.application });
    await refreshApplicants(result.application.jobId);
  }

  function onFile(setter: (file: File | null) => void) {
    return (event: ChangeEvent<HTMLInputElement>) => setter(event.target.files?.[0] ?? null);
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Job listings</h1>
          <p className="mt-2 text-sm opacity-75">Apply with CV and certificate PDFs, then approve verification through Bhutan NDI.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-4">
          {jobs.map(job => (
            <Card key={job.id} className={selectedJob?.id === job.id ? "border-primary" : ""}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{job.title}</h2>
                  <p className="mt-2 text-sm leading-6 opacity-75">{job.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.requirements.map(requirement => (
                      <span key={requirement} className="rounded-md bg-muted px-2 py-1 text-xs">
                        {requirement}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setSelectedJob(job);
                    refreshApplicants(job.id);
                  }}
                >
                  Apply
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-5">
          <Card>
            <h2 className="text-xl font-semibold">Apply with NDI consent</h2>
            <form className="mt-5 grid gap-3" onSubmit={apply}>
              <Input value={applicantName} onChange={event => setApplicantName(event.target.value)} placeholder="Full name" required />
              <Input value={applicantEmail} onChange={event => setApplicantEmail(event.target.value)} placeholder="Email" type="email" required />
              <label className="grid gap-2 text-sm">
                CV PDF
                <Input accept="application/pdf" onChange={onFile(setCv)} type="file" required />
              </label>
              <label className="grid gap-2 text-sm">
                Certificate PDF
                <Input accept="application/pdf" onChange={onFile(setCertificate)} type="file" required />
              </label>
              <Button className="mt-2" disabled={!selectedJob || loading} type="submit">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit and generate NDI QR
              </Button>
            </form>
          </Card>

          {result && (
            <Card>
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">NDI wallet verification</h2>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-[auto_1fr]">
                <img alt="NDI proof request QR" className="h-44 w-44 rounded-md bg-white p-2" src={result.ndiProof.qrDataUrl} />
                <div className="text-sm">
                  <p className="font-medium">Scan this QR with the Bhutan NDI app.</p>
                  <a className="mt-2 block break-all text-primary" href={result.ndiProof.deepLinkURL}>
                    {result.ndiProof.deepLinkURL}
                  </a>
                  <p className="mt-4 rounded-md bg-muted p-3">{result.application.verificationSummary.result}</p>
                  <Button className="mt-4" onClick={approveDemo} variant="outline">
                    Demo approve NDI consent
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {applicants.length > 0 && (
            <Card>
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Employer verification queue</h2>
              </div>
              <div className="mt-4 grid gap-3">
                {applicants.map(applicant => (
                  <div key={applicant.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{applicant.verificationSummary.applicantName ?? "Applicant"}</p>
                        <p className="text-xs opacity-70">{applicant.verificationSummary.applicantEmail}</p>
                      </div>
                      <span className="rounded-md bg-muted px-2 py-1 text-xs">{applicant.status}</span>
                    </div>
                    <p className="mt-2 text-sm opacity-75">{applicant.verificationSummary.result}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
