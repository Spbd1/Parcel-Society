import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { APP_NAME } from "@parcel-society/shared";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "A reproducible behavioral experiment platform foundation.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link className="font-semibold text-slate-950" href="/">
              {APP_NAME}
            </Link>
            <div className="flex gap-4 text-sm text-slate-600">
              <Link className="hover:text-slate-950" href="/participant">
                Participant
              </Link>
              <Link className="hover:text-slate-950" href="/admin">
                Admin
              </Link>
              <Link className="hover:text-slate-950" href="/docs">
                Docs
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
      </body>
    </html>
  );
}
