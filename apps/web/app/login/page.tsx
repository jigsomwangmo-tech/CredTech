"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [result, setResult] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [deepLink, setDeepLink] = useState("");

  async function login(role: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/ndi-login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role, displayName: "Demo NDI User" }),
    });
    setResult(JSON.stringify(await response.json(), null, 2));
  }

  async function startNDILogin() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/ndi-login/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    const data = await response.json();
    setProofUrl(data.proofRequestURL);
    setDeepLink(data.deepLinkURL);
    setResult(JSON.stringify(data, null, 2));
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Card>
        <h1 className="text-2xl font-semibold">Login with Bhutan NDI</h1>
        <p className="mt-2 text-sm opacity-75">Mock biometric NDI authentication returns a DID hash and JWT session.</p>
        <Input className="mt-6 w-full" placeholder="Optional mock did:bt token" />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={startNDILogin}>Start NDI proof</Button>
          <Button onClick={() => login("holder")}>Holder</Button>
          <Button onClick={() => login("issuer")} variant="outline">
            Issuer
          </Button>
          <Button onClick={() => login("employer")} variant="outline">
            Employer
          </Button>
        </div>
        {proofUrl && (
          <div className="mt-6 grid gap-4 md:grid-cols-[auto_1fr]">
            <div className="rounded-md bg-white p-3">
              <QRCodeSVG value={proofUrl} size={160} />
            </div>
            <div className="text-sm">
              <p className="font-medium">Scan with Bhutan NDI Wallet</p>
              <a className="mt-2 block break-all text-primary" href={deepLink}>
                {deepLink}
              </a>
            </div>
          </div>
        )}
        {result && <pre className="mt-6 overflow-auto rounded-md bg-muted p-4 text-xs">{result}</pre>}
      </Card>
    </main>
  );
}
