import { Elysia } from "elysia";
import { AuthService } from "../services/auth-service";
import {
  RegisterDTO,
  LoginDTO,
  VerifyOtpDTO,
  RefreshTokenDTO,
  ForgotPasswordOtpDTO,
  VerifyForgotPasswordOtpDTO,
  ResetPasswordDTO,
} from "../types/auth-types";
import { accessToken, CookieOptions, refreshToken } from "./guards/setup-jwt";
import { validateRefreshToken } from "../utils/auth-helper";

const authService = new AuthService();

export const authRoute = new Elysia({ prefix: "/auth" })
  .use(accessToken)
  .use(refreshToken)
  .post(
    "/register/send-otp",
    async ({ body, set }) => {
      const result = await authService.sendOtp(body);

      set.status = 200;
      return result;
    },
    {
      body: RegisterDTO,
      detail: {
        tags: ["Auth"],
        summary: "Send OTP For Registration",
      },
    },
  )

  .post(
    "/register/verify",
    async ({ body, set }) => {
      try {
        const result = await authService.verifyRegisterOtp(body);

        set.status = 200;
        return result;
      } catch (err) {
        return err;
      }
    },
    {
      body: VerifyOtpDTO,
      detail: {
        tags: ["Auth"],
        summary: "Verify OTP and complete registration",
      },
    },
  )
  .post(
    "/login",
    async ({ body, set, jwtAccess, jwtRefresh }) => {
      const { user, saveTokens } = await authService.login(body);

      const ACCESS_TOKEN = await jwtAccess.sign({ userId: user.id, role: "user" });
      const REFRESH_TOKEN = await jwtRefresh.sign({ userId: user.id, role: "user" });
      // save refresh token to redis
      await saveTokens(REFRESH_TOKEN);

      set.status = 200;
      return { message: "Login successful", user, tokens: { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN } };
    },
    {
      body: LoginDTO,
      detail: {
        tags: ["Auth"],
        summary: "Login user",
      },
    },
  )
  .post(
    "/refresh",
    async ({ set, body, jwtRefresh, jwtAccess }) => {
      const payload = await jwtRefresh.verify(body.refreshToken);
      if (!payload) {
        throw new Error("Invalid refresh token");
      }
      // validate refresh token against redis
      const isValid = await validateRefreshToken(payload.userId, body.refreshToken);
      if (!isValid) {
        throw new Error("Refresh token not recognized");
      }
      const { userId } = await authService.refreshToken(payload.userId);
      const ACCESS_TOKEN = await jwtAccess.sign({ userId, role: "user" });

      set.status = 201;
      return { message: "Access token refreshed", accessToken: ACCESS_TOKEN };
    },
    {
      body: RefreshTokenDTO,
      detail: {
        tags: ["Auth"],
        summary: "Refresh access token",
      },
    },
  )
  .post(
    "/forgot-password/send-otp",
    async ({ body }) => {
      return await authService.sendForgotPasswordOtp(body.email);
    },
    {
      body: ForgotPasswordOtpDTO,
    },
  )
  .post(
    "/forgot-password/verify-otp",
    async ({ body }) => {
      return await authService.verifyForgotPasswordOtp(body);
    },
    {
      body: VerifyForgotPasswordOtpDTO,
    },
  )
  .post(
    "/reset-password",
    async ({ body }) => {
      return await authService.resetPassword(body);
    },
    {
      body: ResetPasswordDTO,
    },
  );
