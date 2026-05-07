import { requireUser } from "@/lib/auth/session";
import { ReportIssueForm } from "./ui/report-issue-form";
import { PageHeader } from "@/components/app/page-header";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  await requireUser();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <PageHeader
        title="Report an issue"
        description="Photo + location + type + severity. Submit in a few taps."
      />

      <ReportIssueForm />
    </main>
  );
}

