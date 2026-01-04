import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import { ICookiesOptions } from "../../types/cookie-type";

export const CookieOptions: ICookiesOptions = {
  accessToken: {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // parseInt(process.env.JWT_TOKEN_EXPIRATION_TIME || "7d"),
  },
  refreshToken: {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/auth/refresh-token",
    maxAge: 30 * 24 * 60 * 60, //parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME || "30d"),
  },
};

export const accessToken = new Elysia({
  name: "jwtAccess",
}).use(
  jwt({
    name: "jwtAccess",
    schema: t.Object({
      userId: t.Number(),
      role: t.String(),
    }),
    secret: process.env.JWT_ACCESS_SECRET ?? "DO NOT USE THIS SECRET KEY",
    exp: "15m",
  }),
);

export const refreshToken = new Elysia({
  name: "jwtRefresh",
}).use(
  jwt({
    name: "jwtRefresh",
    schema: t.Object({
      userId: t.Number(),
      role: t.String(),
    }),
    secret: process.env.JWT_REFRESH_SECRET ?? "DO NOT USE THIS SECRET KEY",
    exp: "7d",
  }),
);
