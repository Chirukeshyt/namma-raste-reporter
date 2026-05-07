export const reportStatuses = [
  "submitted",
  "reviewed",
  "assigned",
  "in_progress",
  "resolved",
  "rejected",
] as const;

export type ReportStatus = (typeof reportStatuses)[number];

export function formatStatus(status: string): string {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "reviewed":
      return "Reviewed";
    case "assigned":
      return "Assigned";
    case "in_progress":
      return "In Progress";
    case "resolved":
      return "Resolved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

