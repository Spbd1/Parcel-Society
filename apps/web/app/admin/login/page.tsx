import Link from "next/link";
import { AdminPageHeader, Card } from "../_components/ui";

export default function AdminLoginPage() {
  return (
    <>
      <AdminPageHeader
        title="Admin access"
        description="Admin pages and APIs are protected by HTTP Basic Auth using ADMIN_EMAIL and ADMIN_PASSWORD. Your browser prompts for credentials before this page loads."
      />
      <Card>
        <div className="max-w-2xl space-y-4 text-sm text-slate-700">
          <p>
            There is no separate in-app admin session for the MVP. To switch
            users, clear this site&apos;s saved Basic Auth credentials in your
            browser or open a private browsing window.
          </p>
          <p>
            API downloads and admin actions use the same browser-authenticated
            request context; credentials are not stored in localStorage.
          </p>
          <Link className="inline-flex rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white" href="/admin">
            Back to admin dashboard
          </Link>
        </div>
      </Card>
    </>
  );
}
