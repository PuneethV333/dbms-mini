import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function isDryRun(): boolean {
  return (process.env.EMAIL_DRY_RUN ?? "true").trim().toLowerCase() !== "false";
}

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = (process.env.SMTP_HOST ?? "").trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = (process.env.SMTP_USER ?? "").trim();
  const pass = process.env.SMTP_PASS ?? "";
  const fromEmail = (process.env.SMTP_FROM_EMAIL ?? "").trim();

  if (!host || !user || !pass || !fromEmail) {
    throw new Error(
      "SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM_EMAIL are required when EMAIL_DRY_RUN=false.",
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: (process.env.SMTP_SECURE ?? "false").toLowerCase() === "true",
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (isDryRun()) {
    console.log(`[email dry-run] to=${to} subject=${JSON.stringify(subject)}`);
    return;
  }

  const fromEmail = (process.env.SMTP_FROM_EMAIL ?? "").trim();
  const fromName = (process.env.SMTP_FROM_NAME ?? "bSafe").trim();
  const info = await getTransporter().sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    html,
  });
  console.log(`[email] sent id=${info.messageId} to=${to}`);
}

export function emailSubject(userName: string): string {
  return `bSafe SOS from ${userName}`;
}

export function emailHtml(input: {
  userName: string;
  triggeredAt: string;
  trackingUrl: string;
}): string {
  const when = formatTime(input.triggeredAt);
  return `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827">
  <h2 style="margin-bottom:8px">bSafe SOS alert</h2>
  <p><strong>${escapeHtml(input.userName)}</strong> triggered an emergency alert at ${escapeHtml(when)}.</p>
  <p>Track the live location and acknowledge the alert here:</p>
  <p>
    <a href="${escapeHtml(input.trackingUrl)}"
       style="display:inline-block;background:#e12d4a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">
      Open live tracking
    </a>
  </p>
  <p style="color:#6b7280;font-size:12px">
    This link is view-only and stops updating when the alert is resolved.
  </p>
</div>`.trim();
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
