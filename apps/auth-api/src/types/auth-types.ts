import z from "zod";

export const RegisterDTO = z.object({
  email: z.email("Invalid email format"),
  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter"),
  name: z.string("Name is required").min(2, "Name must be at least 2 characters long"),
});

export const VerifyOtpDTO = z.object({
  email: z.email("Invalid email format"),
  otp: z.string("OTP is required").length(6, "OTP must be 6 characters long"),
});
export const LoginDTO = z.object({
  email: z.email("Invalid email format"),
  password: z.string("Password is required").min(8, "Password must be at least 8 characters long"),
});

export const RefreshTokenDTO = z.object({
  refreshToken: z.string(),
});

export const ForgotPasswordOtpDTO = z.object({
  email: z.email("Invalid email format"),
});

export const VerifyForgotPasswordOtpDTO = z.object({
  email: z.email("Invalid email format"),
  otp: z.string("OTP is required").length(6, "OTP must be 6 characters long"),
});

export const ResetPasswordDTO = z.object({
  email: z.email("Invalid email format"),
  resetToken: z.string("Reset token is required"),
  newPassword: z
    .string("New password is required")
    .min(8, "New password must be at least 8 characters long")
    .regex(/[A-Z]/, "New password must contain at least one uppercase letter"),
});
