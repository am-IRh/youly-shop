import { db, users, eq } from "@youly/database";
import {
  checkOtpRestriction,
  trackOtpRequest,
  sendOtp,
  savePendingRegistration,
  getPendingRegistration,
  verifyOtp,
  cleanupOtpData,
  hashPassword,
  verifyPassword,
  saveRefreshToken,
  checkForgotPasswordRestriction,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  cleanupForgotPasswordData,
  revokeAllRefreshTokens,
  verifyResetToken,
} from "../utils/auth-helper";
import { AuthenticationError } from "../utils/errors/app-error";

export class AuthService {
  async sendOtp(data: { email: string; password: string; name: string }) {
    const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1);

    if (existingUser.length > 0) {
      throw new AuthenticationError("Registration failed");
    }

    await checkOtpRestriction(data.email);

    await trackOtpRequest(data.email);

    const hashedPassword = await hashPassword(data.password);

    await savePendingRegistration(data.email, {
      name: data.name,
      hashedPassword,
    });

    await sendOtp(data.name, data.email);

    return { message: "OTP sent successfully" };
  }

  async verifyRegisterOtp(data: { email: string; otp: string }) {
    await verifyOtp(data.email, data.otp);

    const pendingData = await getPendingRegistration(data.email);

    if (!pendingData) {
      throw new AuthenticationError("Registration session expired");
    }

    const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1);

    if (existingUser.length > 0) {
      await cleanupOtpData(data.email);
      throw new AuthenticationError("Registration failed");
    }

    const [user] = await db
      .insert(users)
      .values({
        name: pendingData.name,
        email: pendingData.email,
        password: pendingData.hashedPassword,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      });

    await cleanupOtpData(data.email);

    return {
      message: "Registration successful",
      user,
    };
  }
  async login(data: { email: string; password: string }) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        password: users.password,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    const isPasswordValid = await verifyPassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid email or password");
    }

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      saveTokens: async (refreshToken: string) => {
        await saveRefreshToken(user.id, refreshToken);
      },
    };
  }
  // =========== REFRESH TOKEN ===========
  async refreshToken(userId: number) {
    const [user] = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AuthenticationError("User not found");
    }
    return { userId: user.id };
  }

  async sendForgotPasswordOtp(email: string) {
    const [user] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return { message: "If the email exists, an OTP has been sent" };
    }

    await checkForgotPasswordRestriction(email);

    await sendForgotPasswordOtp(user.name, email);
    return { message: "OTP sent successfully" };
  }
  async verifyForgotPasswordOtp(data: { email: string; otp: string }) {
    const resetToken = await verifyForgotPasswordOtp(data.email, data.otp);

    return {
      message: "OTP verified successfully",
      resetToken,
    };
  }
  async resetPassword(data: { email: string; resetToken: string; newPassword: string }) {
    await verifyResetToken(data.email, data.resetToken);

    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1);

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const hashedPassword = await hashPassword(data.newPassword);

    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, user.id));

    await cleanupForgotPasswordData(data.email);

    await revokeAllRefreshTokens(user.id);

    return { message: "Password reset successfully" };
  }
}
