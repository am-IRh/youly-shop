import Elysia from "elysia";
import { authRoute } from "./auth-route";

export const apiRoutes = new Elysia({ prefix: "/api" }).use(authRoute);
