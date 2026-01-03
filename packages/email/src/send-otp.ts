import { resend } from "./resend.client";
import { otpEmailTemplate } from "./templates/otp";

type SendOtpInput = {
  to: string;
  name: string;
  code: string;
};

export async function sendOtpEmail({ to, code, name }: SendOtpInput) {
  const template = otpEmailTemplate(name, code);

  const { error } = await resend.emails.send({
    from: "Auth <onboarding@resend.dev>",
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (error) {
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }

  return true;
}
