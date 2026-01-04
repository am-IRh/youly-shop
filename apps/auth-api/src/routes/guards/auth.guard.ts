import { Elysia } from "elysia";
import { accessToken } from "./setup-jwt";

export const authGuard = new Elysia({ name: "auth-guard" }).use(accessToken).derive(async ({ headers, jwtAccess, set }) => {
  const authHeader = headers.authorization;

  if (!authHeader) {
    return { user: null };
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return { user: null };
  }

  try {
    const payload = jwtAccess.verify(token);
    return { user: payload };
  } catch (err) {
    return { user: null };
  }
});
