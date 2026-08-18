// Transactional email (PART 58 — reusable templates, swappable provider).
//
// Any SMTP provider works (Resend, Postmark, SES, Mailgun — see
// .env.example). If EMAIL_SERVER_HOST isn't configured yet (fresh local
// setup, before Phase 3's env vars are filled in), emails are logged to
// the server console instead of failing outright — this keeps the
// registration/reset flows fully testable without a real mail account.

import nodemailer from "nodemailer";
import { env } from "@/lib/env";

function getTransport() {
  if (!env.EMAIL_SERVER_HOST || !env.EMAIL_SERVER_USER || !env.EMAIL_SERVER_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.EMAIL_SERVER_HOST,
    port: Number(env.EMAIL_SERVER_PORT ?? "587"),
    secure: Number(env.EMAIL_SERVER_PORT ?? "587") === 465,
    auth: { user: env.EMAIL_SERVER_USER, pass: env.EMAIL_SERVER_PASSWORD },
  });
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const transport = getTransport();
  const from = env.EMAIL_FROM ?? "MCloud Adapt Pilot <no-reply@mediacloud.studio>";

  if (!transport) {
    // Dev fallback — makes the email content (including the verification /
    // reset link) visible in the terminal running `npm run dev`.
    console.log("\n────────── [DEV EMAIL — no SMTP configured] ──────────");
    console.log(`To: ${to}\nSubject: ${subject}\n\n${html}`);
    console.log("────────────────────────────────────────────────────────\n");
    return;
  }

  await transport.sendMail({ from, to, subject, html });
}

function emailLayout(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a22;">
      <p style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #4b4fdb; font-weight: 600;">MediaCloud Studio</p>
      <h1 style="font-size: 20px; margin: 8px 0 20px;">${title}</h1>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #8c8c9c;">
        MCloud Adapt Pilot · MediaCloud Studio Pvt Ltd
      </p>
    </div>
  `;
}

function buttonHtml(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block; background:#4b4fdb; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600; font-size:14px;">${label}</a>`;
}

export async function sendVerificationEmail(to: string, firstName: string, verifyUrl: string) {
  await sendEmail({
    to,
    subject: "Verify your email — MCloud Adapt Pilot",
    html: emailLayout(
      "Verify your email address",
      `
        <p>Hi ${firstName},</p>
        <p>Thanks for creating a MCloud Adapt Pilot account. Confirm your email address to activate it:</p>
        <p style="margin: 24px 0;">${buttonHtml("Verify Email", verifyUrl)}</p>
        <p style="font-size: 13px; color: #565669;">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
      `
    ),
  });
}

export async function sendPasswordResetEmail(to: string, firstName: string, resetUrl: string) {
  await sendEmail({
    to,
    subject: "Reset your password — MCloud Adapt Pilot",
    html: emailLayout(
      "Reset your password",
      `
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your MCloud Adapt Pilot password. Choose a new one here:</p>
        <p style="margin: 24px 0;">${buttonHtml("Reset Password", resetUrl)}</p>
        <p style="font-size: 13px; color: #565669;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.</p>
      `
    ),
  });
}

export async function sendPasswordChangedEmail(to: string, firstName: string) {
  await sendEmail({
    to,
    subject: "Your password was changed — MCloud Adapt Pilot",
    html: emailLayout(
      "Your password was changed",
      `
        <p>Hi ${firstName},</p>
        <p>This confirms your MCloud Adapt Pilot password was just changed, and any other devices you were signed in on have been signed out.</p>
        <p style="font-size: 13px; color: #565669;">If this wasn't you, contact support immediately at support@mediacloud.studio.</p>
      `
    ),
  });
}
