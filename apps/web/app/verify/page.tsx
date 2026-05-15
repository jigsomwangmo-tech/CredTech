"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function VerifyPage() {
  const [credentialId, setCredentialId] = useState("");
  const [result, setResult] = useState("");

  async function verify() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/credentials/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ credentialId }),
    });
    setResult(JSON.stringify(await response.json(), null, 2));
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Card>
        <h1 className="text-2xl font-semibold">Verify certificate</h1>
        <div className="mt-6 flex gap-3">
          <Input value={credentialId} onChange={event => setCredentialId(event.target.value)} placeholder="0x credential id" className="flex-1" />
          <Button onClick={verify}>
            <Search className="mr-2 h-4 w-4" />
            Verify
          </Button>
        </div>
        {result && <pre className="mt-6 overflow-auto rounded-md bg-muted p-4 text-xs">{result}</pre>}
      </Card>
    </main>
  );
}
