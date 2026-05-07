import nodemailer from "nodemailer";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export function getAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}

export function createSmtpTransport() {
  const host = getRequiredEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = (process.env.SMTP_SECURE ?? "false") === "true";
  const user = getRequiredEnv("SMTP_USER");
  const pass = getRequiredEnv("SMTP_PASS");
  const debug = (process.env.SMTP_DEBUG ?? "false") === "true";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    logger: debug,
    debug,
  });
}

export type ReportCreatedEmailPayload = {
  toEmail: string;
  ticketId: string;
  issueType: string;
  severity: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  createdAtIso: string;
};

export async function sendReportCreatedEmail(payload: ReportCreatedEmailPayload) {
  const from = process.env.SMTP_FROM ?? "Namma-Raste Reporter <no-reply@namma-raste.local>";
  const appUrl = getAppBaseUrl();
  const trackUrl = `${appUrl}/track?ticketId=${encodeURIComponent(payload.ticketId)}`;

  const subject = `Ticket ${payload.ticketId} created`;

  const safe = (value?: string | null) => (value && value.trim().length ? value : "—");
  const coords =
    typeof payload.latitude === "number" && typeof payload.longitude === "number"
      ? `${payload.latitude.toFixed(6)}, ${payload.longitude.toFixed(6)}`
      : "—";

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">Namma-Raste Reporter</h2>
      <p style="margin: 0 0 12px;">Your issue has been submitted successfully.</p>
      <div style="padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb;">
        <div style="font-size: 12px; color: #6b7280;">Ticket ID</div>
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas; font-size: 18px; font-weight: 700;">
          ${payload.ticketId}
        </div>
      </div>
      <p style="margin: 16px 0 0;">
        <a href="${trackUrl}" style="display: inline-block; padding: 10px 14px; border-radius: 10px; background: #16a34a; color: white; text-decoration: none; font-weight: 600;">
          Track status
        </a>
      </p>
      <h3 style="margin: 18px 0 8px;">Submitted details</h3>
      <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
        <tr><td style="padding: 6px 0; color:#6b7280; width: 160px;">Issue type</td><td style="padding: 6px 0;">${payload.issueType}</td></tr>
        <tr><td style="padding: 6px 0; color:#6b7280;">Severity</td><td style="padding: 6px 0;">${payload.severity}</td></tr>
        <tr><td style="padding: 6px 0; color:#6b7280;">Address</td><td style="padding: 6px 0;">${safe(payload.address)}</td></tr>
        <tr><td style="padding: 6px 0; color:#6b7280;">Coordinates</td><td style="padding: 6px 0;">${coords}</td></tr>
        <tr><td style="padding: 6px 0; color:#6b7280;">Description</td><td style="padding: 6px 0;">${safe(payload.description)}</td></tr>
        <tr><td style="padding: 6px 0; color:#6b7280;">Submitted at</td><td style="padding: 6px 0;">${new Date(payload.createdAtIso).toLocaleString()}</td></tr>
      </table>
      <p style="margin: 18px 0 0; font-size: 12px; color:#6b7280;">
        If you didn’t create this ticket, you can ignore this email.
      </p>
    </div>
  `;

  const transport = createSmtpTransport();
  await transport.sendMail({
    from,
    to: payload.toEmail,
    subject,
    html,
    text: `Ticket ${payload.ticketId} created.\nTrack: ${trackUrl}\nType: ${payload.issueType}\nSeverity: ${payload.severity}\nAddress: ${payload.address ?? "-"}\nCoords: ${coords}\nDescription: ${payload.description ?? "-"}\nSubmitted: ${payload.createdAtIso}`,
  });

  return { trackUrl };
}

