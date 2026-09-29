import { Resend } from "resend";

/**
 * Email service using Resend (free tier: 100 emails/day).
 *
 * Sign up at https://resend.com → get your API key → add to .env:
 *   RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
 *
 * The default sender is onboarding@resend.dev (Resend's testing domain).
 * For production, you'd verify your own domain.
 */

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "LendLoop <onboarding@resend.dev>";

/** Send an email — returns true on success, false on failure. */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  // If no API key is set, skip email sending (the app still works).
  if (!process.env.RESEND_API_KEY) {
    console.log(`📧 Email skipped (no RESEND_API_KEY): would send to ${to}: ${subject}`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });
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
    "Your LendLoop account is approved! 🎉",
    `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #FFFCF7; padding: 40px; border-radius: 12px; border: 1px solid #E8DCC8;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #C85A3B; font-size: 28px; margin: 0;">LendLoop</h1>
        <p style="color: #6B5D52; font-size: 14px; margin: 4px 0 0;">A Digital Bayanihan</p>
      </div>
      <h2 style="color: #2A1F18; font-size: 22px;">Mabuhay, ${name}! 🎉</h2>
      <p style="color: #3D2E24; font-size: 16px; line-height: 1.6;">
        Great news — your LendLoop account has been <strong>approved</strong> by the barangay admin!
        You can now log in and start lending and borrowing with your kapitbahay.
      </p>
      <div style="background: #FBE9DF; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <a href="${process.env.APP_URL || "http://localhost:3000"}"
           style="background: #C85A3B; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
          Log in to LendLoop
        </a>
      </div>
      <p style="color: #9C8B7E; font-size: 13px; margin-top: 30px; border-top: 1px solid #E8DCC8; padding-top: 16px;">
        LendLoop — A Digital Bayanihan Resource Sharing System<br>
        You received this email because you registered at LendLoop.
      </p>
    </div>
    `,
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
    `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #FFFCF7; padding: 40px; border-radius: 12px; border: 1px solid #E8DCC8;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #C85A3B; font-size: 28px; margin: 0;">LendLoop</h1>
        <p style="color: #6B5D52; font-size: 14px; margin: 4px 0 0;">A Digital Bayanihan</p>
      </div>
      <h2 style="color: #2A1F18; font-size: 22px;">Hi ${name},</h2>
      <p style="color: #3D2E24; font-size: 16px; line-height: 1.6;">
        Thank you for your interest in LendLoop. Unfortunately, your registration could not be
        verified at this time.
      </p>
      ${note ? `<p style="color: #3D2E24; font-size: 15px; background: #F5DAD7; padding: 12px; border-radius: 8px;"><strong>Admin note:</strong> ${note}</p>` : ""}
      <p style="color: #3D2E24; font-size: 16px; line-height: 1.6;">
        You're welcome to register again with clearer photos. If you believe this is a mistake,
        please contact your barangay admin.
      </p>
      <p style="color: #9C8B7E; font-size: 13px; margin-top: 30px; border-top: 1px solid #E8DCC8; padding-top: 16px;">
        LendLoop — A Digital Bayanihan Resource Sharing System
      </p>
    </div>
    `,
  );
}
