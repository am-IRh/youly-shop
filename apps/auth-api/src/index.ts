import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import { logger } from "@bogeychan/elysia-logger";

import { StatusCodes } from "http-status-codes";
import { apiRoutes } from "./routes";
import { AppError } from "./utils/errors/app-error";

const app = new Elysia()
  .use(cors())
  .use(logger())
  .use(openapi())
  .use(apiRoutes)
  .error({
    APP_ERROR: AppError,
  })
  .onError({ as: "global" }, ({ error, request, code, set }) => {
    let message = "Unknown error occurred";
    let details;
    set.status = StatusCodes.INTERNAL_SERVER_ERROR;

    switch (code) {
      case "NOT_FOUND":
        set.status = 404;
        message = `${request.method} ${request.url} is not a valid endpoint.`;
        break;
      case "PARSE":
        set.status = 400;
        message = error.message;
        break;
      case "VALIDATION":
        set.status = 422;
        message = error.all[0].summary!;
        break;
      case "APP_ERROR":
        set.status = error.statusCode;
        message = error.message;
        details = error.details && error.details;
        break;
    }

    return Response.json({ error: message, details }, { status: set.status });
  })
  .listen(8080);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
