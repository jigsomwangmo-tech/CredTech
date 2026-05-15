import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "NDI Credential Chain",
  description: "Bhutan NDI credential issuance, verification, and recruitment platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-border bg-background/90">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold">
              NDI Credential Chain
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href="/verify">Verify</Link>
              <Link href="/jobs">Jobs</Link>
              <Link href="/login">NDI Login</Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
