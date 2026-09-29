// @ts-ignore — Resend is lazy-loaded to prevent build-time crashes
import type { Resend as ResendType } from "resend";

/**
 * Email service using Resend (free tier: 100 emails/day).
 *
 * Lazy-loaded — the Resend client is only created when an email is actually
 * sent, not at module load time. This prevents build errors when the
 * RESEND_API_KEY env var isn't available during the build process.
 */

let _resend: ResendType | null = null;
let _resendLoaded = false;

async function getResend(): Promise<ResendType | null> {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resendLoaded) {
    _resendLoaded = true;
    try {
      const mod = await import("resend");
      _resend = new mod.Resend(process.env.RESEND_API_KEY);
    } catch (e) {
      console.error("Failed to load Resend:", e);
      return null;
    }
  }
  return _resend;
}

const FROM = "LendLoop <onboarding@resend.dev>";

/** Send an email — returns true on success, false on failure. */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const resend = await getResend();
  if (!resend) {
    console.log(`📧 Email skipped (no RESEND_API_KEY): would send to ${to}: ${subject}`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("Email send error:", error);
      return false;
    }
    console.log(`📧 Email sent to ${to}: ${subject}`);
    return true;
  } catch (e) {
    console.error("Email send failed:", e);
    return false;
  }
}

/** Send a verification-approved email to a newly approved member. */
export async function sendVerificationApprovedEmail(
  to: string,
  name: string,
): Promise<void> {
  await sendEmail(
    to,
    "Your LendLoop account is approved!",
    `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#FFFCF7;padding:40px;border-radius:12px;border:1px solid #E8DCC8">
      <h1 style="color:#C85A3B;font-size:28px;margin:0 0 8px">LendLoop 🎉</h1>
      <h2 style="color:#2A1F18">Mabuhay, ${name}!</h2>
      <p style="color:#3D2E24;font-size:16px;line-height:1.6">
        Great news — your LendLoop account has been <strong>approved</strong> by the barangay admin!
        You can now log in and start lending and borrowing with your kapitbahay.
      </p>
      <p style="margin-top:30px;color:#9C8B7E;font-size:13px">
        LendLoop — A Digital Bayanihan Resource Sharing System
      </p>
    </div>`,
  );
}

/** Send a verification-rejected email. */
export async function sendVerificationRejectedEmail(
  to: string,
  name: string,
  note?: string,
): Promise<void> {
  await sendEmail(
    to,
    "Your LendLoop verification update",
    `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#FFFCF7;padding:40px;border-radius:12px;border:1px solid #E8DCC8">
      <h1 style="color:#C85A3B;font-size:28px;margin:0 0 8px">LendLoop</h1>
      <h2 style="color:#2A1F18">Hi ${name},</h2>
      <p style="color:#3D2E24;font-size:16px;line-height:1.6">
        Thank you for your interest in LendLoop. Unfortunately, your registration could not be verified at this time.
      </p>
      ${note ? `<p style="color:#3D2E24;font-size:15px;background:#F5DAD7;padding:12px;border-radius:8px"><strong>Admin note:</strong> ${note}</p>` : ""}
      <p style="color:#3D2E24;font-size:16px;line-height:1.6">
        You're welcome to register again with clearer photos. If you believe this is a mistake, please contact your barangay admin.
      </p>
      <p style="margin-top:30px;color:#9C8B7E;font-size:13px">
        LendLoop — A Digital Bayanihan Resource Sharing System
      </p>
    </div>`,
  );
}
