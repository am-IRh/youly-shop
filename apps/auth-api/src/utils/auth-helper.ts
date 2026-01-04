import redis from "@youly/database/redis";
import { sendOtpEmail } from "@youly/email";
import { randomBytes, randomInt } from "node:crypto";
import { AuthenticationError } from "../utils/errors/app-error";

// ============= OTP Restrictions =============
export const checkOtpRestriction = async (email: string) => {
  if (await redis.get(`otp_lock:${email}`)) {
    throw new AuthenticationError("OTP requests are temporarily locked");
  }

  if (await redis.get(`otp_spam_lock:${email}`)) {
    throw new AuthenticationError("Too many OTP requests. Try again in 1 hour");
  }

  if (await redis.get(`otp_cooldown:${email}`)) {
    throw new AuthenticationError("Please wait 60 seconds before requesting another OTP");
  }
};

// ============= Track Requests =============
export const trackOtpRequest = async (email: string) => {
  const otpRequestKey = `otp_requests_count:${email}`;
  const count = await redis.incr(otpRequestKey);

  if (count === 1) {
    await redis.expire(otpRequestKey, 600);
  }

  if (count > 5) {
    await redis.set(`otp_spam_lock:${email}`, "1", "EX", 3600);
    throw new AuthenticationError("Too many OTP requests. Try again in 1 hour");
  }

  return count;
};
// {
//   "message": "Login successful",
//   "user": {
//     "id": 11,
//     "email": "iyou@gmail.com",
//     "name": "you",
//     "createdAt": "2026-01-04T18:57:22.859Z"
//   },
//   "tokens": {
//     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjExLCJyb2xlIjoidXNlciIsImV4cCI6MjU5MjAwMCwiaWF0IjoxNzY3NTUzMDcwfQ.GhvCIHEYgL0cKmbFoOePCGfAAXM55XMq19UVZDoEFxQ",
//     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjExLCJyb2xlIjoidXNlciIsImV4cCI6MjU5MjAwMCwiaWF0IjoxNzY3NTUzMDcwfQ.FwbRopXrskX4mMeK6eJsaBLemf24vatP3W0gq_zJWOU"
//   }
// }

// ============= Send OTP =============
export const sendOtp = async (name: string, email: string) => {
  const otp = randomInt(100000, 999999).toString();

  // await sendOtpEmail({ to: email, code: otp, name });

  await redis.set(`otp:${email}`, otp, "EX", 300);
  await redis.set(`otp_cooldown:${email}`, "1", "EX", 60);

  return otp;
};

// ============= Pending Data Management =============
export const savePendingRegistration = async (email: string, data: { name: string; hashedPassword: string }) => {
  const pendingData = JSON.stringify({
    email,
    name: data.name,
    hashedPassword: data.hashedPassword,
  });

  await redis.set(`pending:${email}`, pendingData, "EX", 300);
};

export const getPendingRegistration = async (email: string) => {
  const pendingDataStr = await redis.get(`pending:${email}`);

  if (!pendingDataStr) {
    return null;
  }

  return JSON.parse(pendingDataStr) as {
    email: string;
    name: string;
    hashedPassword: string;
  };
};

// ============= OTP Verification =============
export const verifyOtp = async (email: string, otp: string) => {
  const storedOtp = await redis.get(`otp:${email}`);

  if (!storedOtp) {
    throw new AuthenticationError("OTP expired or not found");
  }

  if (storedOtp !== otp) {
    const attemptsKey = `otp_attempts:${email}`;
    const attempts = await redis.incr(attemptsKey);

    if (attempts === 1) {
      await redis.expire(attemptsKey, 300);
    }

    if (attempts >= 3) {
      await redis.set(`otp_lock:${email}`, "1", "EX", 900);
      await cleanupOtpData(email);
      throw new AuthenticationError("Too many failed attempts. Locked for 15 minutes");
    }

    throw new AuthenticationError(`Invalid OTP. ${3 - attempts} attempts remaining`);
  }

  return true;
};

// ============= Cleanup =============
export async function cleanupOtpData(email: string) {
  const keysToDelete = [
    `otp:${email}`,
    `otp_requests_count:${email}`,
    `otp_cooldown:${email}`,
    `pending:${email}`,
    `otp_attempts:${email}`,
  ];

  await redis.del(...keysToDelete);
}

// ============= Refresh Token Management =============
export const saveRefreshToken = async (userId: number, refreshToken: string, expiresIn: number = 7 * 24 * 60 * 60) => {
  const tokenId = randomBytes(16).toString("hex");

  const tokenKey = `refresh_token:${userId}:${tokenId}`;
  await redis.set(tokenKey, refreshToken, "EX", expiresIn);

  const setKey = `user_tokens:${userId}`;
  await redis.sadd(setKey, tokenId);
  await redis.expire(setKey, expiresIn);

  return tokenId;
};

export const validateRefreshToken = async (userId: number, refreshToken: string): Promise<boolean> => {
  const setKey = `user_tokens:${userId}`;
  const tokenIds = await redis.smembers(setKey);

  for (const tokenId of tokenIds) {
    const tokenKey = `refresh_token:${userId}:${tokenId}`;
    const storedToken = await redis.get(tokenKey);

    if (storedToken === refreshToken) {
      return true;
    }
  }

  return false;
};

export const revokeRefreshToken = async (userId: number, refreshToken: string) => {
  const setKey = `user_tokens:${userId}`;
  const tokenIds = await redis.smembers(setKey);

  for (const tokenId of tokenIds) {
    const tokenKey = `refresh_token:${userId}:${tokenId}`;
    const storedToken = await redis.get(tokenKey);

    if (storedToken === refreshToken) {
      await redis.del(tokenKey);
      await redis.srem(setKey, tokenId);
      return true;
    }
  }

  return false;
};

export const revokeAllRefreshTokens = async (userId: number) => {
  const setKey = `user_tokens:${userId}`;
  const tokenIds = await redis.smembers(setKey);

  const tokenKeys = tokenIds.map(id => `refresh_token:${userId}:${id}`);
  if (tokenKeys.length > 0) {
    await redis.del(...tokenKeys);
  }

  await redis.del(setKey);

  return tokenIds.length;
};

// ============ Password Hashing =============
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 12,
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

// ============= Forgot Password =============
export const sendForgotPasswordOtp = async (name: string, email: string) => {
  const otp = randomInt(100000, 999999).toString();

  // await sendOtpEmail({ to: email, code: otp, name });

  await redis.set(`forgot_password_otp:${email}`, otp, "EX", 600);

  await redis.set(`forgot_password_cooldown:${email}`, "1", "EX", 60);

  return otp;
};

export const verifyForgotPasswordOtp = async (email: string, otp: string) => {
  const storedOtp = await redis.get(`forgot_password_otp:${email}`);

  if (!storedOtp) {
    throw new AuthenticationError("OTP expired or not found");
  }

  if (storedOtp !== otp) {
    const attemptsKey = `forgot_password_attempts:${email}`;
    const attempts = await redis.incr(attemptsKey);

    if (attempts === 1) {
      await redis.expire(attemptsKey, 600);
    }

    if (attempts >= 3) {
      await redis.set(`forgot_password_lock:${email}`, "1", "EX", 900);

      await redis.del(`forgot_password_otp:${email}`, `forgot_password_attempts:${email}`);
      throw new AuthenticationError("Too many failed attempts. Locked for 15 minutes");
    }

    throw new AuthenticationError(`Invalid OTP. ${3 - attempts} attempts remaining`);
  }
  const resetToken = randomBytes(32).toString("hex");
  await redis.del(`forgot_password_otp:${email}`, `forgot_password_attempts:${email}`);
  await redis.set(`password_reset_token:${email}`, resetToken, "EX", 900);
  return resetToken;
};

export const checkForgotPasswordRestriction = async (email: string) => {
  if (await redis.get(`forgot_password_lock:${email}`)) {
    throw new AuthenticationError("Too many failed attempts. Try again later");
  }

  if (await redis.get(`forgot_password_cooldown:${email}`)) {
    throw new AuthenticationError("Please wait 60 seconds before requesting another OTP");
  }
};

export const cleanupForgotPasswordData = async (email: string) => {
  const keysToDelete = [
    `forgot_password_otp:${email}`,
    `forgot_password_cooldown:${email}`,
    `forgot_password_lock:${email}`,
    `forgot_password_attempts:${email}`,
    `password_reset_token:${email}`,
  ];

  await redis.del(...keysToDelete);
};

export const verifyResetToken = async (email: string, resetToken: string) => {
  const storedToken = await redis.get(`password_reset_token:${email}`);

  if (!storedToken || storedToken !== resetToken) {
    throw new AuthenticationError("Invalid or expired reset token");
  }
  return true;
};
