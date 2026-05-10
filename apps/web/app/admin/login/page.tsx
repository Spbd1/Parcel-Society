"use client";
import { useState } from "react";
import { AdminPageHeader, Card } from "../_components/ui";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("changeme");
  const [saved, setSaved] = useState(false);
  return (
    <>
      <AdminPageHeader
        title="Admin API login"
        description="Stores Basic Auth credentials locally for admin action buttons and API downloads. Demo defaults are for local development only."
      />
      <Card>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            window.localStorage.setItem(
              "parcel_admin_basic",
              btoa(`${email}:${password}`),
            );
            setSaved(true);
          }}
          className="max-w-md space-y-4"
        >
          <label className="block text-sm font-medium">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <p className="text-xs text-amber-700">
            Demo credentials are only for local development.
          </p>
          <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            Save credentials
          </button>
          {saved ? (
            <p className="text-sm text-emerald-700">
              Credentials saved in this browser.
            </p>
          ) : null}
        </form>
      </Card>
    </>
  );
}
