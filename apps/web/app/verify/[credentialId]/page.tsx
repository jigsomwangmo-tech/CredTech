import { Card } from "@/components/ui/card";

export default async function CredentialVerifyPage({ params }: { params: Promise<{ credentialId: string }> }) {
  const { credentialId } = await params;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Card>
        <p className="text-sm uppercase tracking-[0.16em] text-primary">QR verification</p>
        <h1 className="mt-3 text-2xl font-semibold">Credential {credentialId.slice(0, 12)}...</h1>
        <p className="mt-3 text-sm opacity-75">Use the verifier to fetch database metadata and on-chain validity.</p>
      </Card>
    </main>
  );
}
