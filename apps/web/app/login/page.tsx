"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [result, setResult] = useState("");

  async function login(role: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/ndi-login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role, displayName: "Demo NDI User" }),
    });
    setResult(JSON.stringify(await response.json(), null, 2));
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Card>
        <h1 className="text-2xl font-semibold">Login with Bhutan NDI</h1>
        <p className="mt-2 text-sm opacity-75">Mock biometric NDI authentication returns a DID hash and JWT session.</p>
        <Input className="mt-6 w-full" placeholder="Optional mock did:bt token" />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => login("holder")}>Holder</Button>
          <Button onClick={() => login("issuer")} variant="outline">
            Issuer
          </Button>
          <Button onClick={() => login("employer")} variant="outline">
            Employer
          </Button>
        </div>
        {result && <pre className="mt-6 overflow-auto rounded-md bg-muted p-4 text-xs">{result}</pre>}
      </Card>
    </main>
  );
}
