import { TrackTicketForm } from "./ui/track-ticket-form";
import { PageHeader } from "@/components/app/page-header";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function TrackPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialTicketId =
    typeof params.ticketId === "string"
      ? params.ticketId
      : Array.isArray(params.ticketId)
        ? params.ticketId[0]
        : "";

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <PageHeader
        title="Track a ticket"
        description="Enter your Ticket ID to see the current status and timeline."
      />

      <TrackTicketForm initialTicketId={initialTicketId} />
    </main>
  );
}

