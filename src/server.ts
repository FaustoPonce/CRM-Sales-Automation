import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { validateAbstractCompanyEnrichmentResponse } from "./lead-validation/abstract.js";
import { validateLeadEvent } from "./lead-validation/validate.js";
import { scoreLeadRequest } from "./lead-scoring/score.js";

const port = Number(process.env.PORT ?? "8787");
const maxRequestBodyBytes = 64 * 1024;

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT debe ser un puerto TCP válido.");
}

class RequestBodyTooLargeError extends Error {}

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;

    if (totalBytes > maxRequestBodyBytes) {
      throw new RequestBodyTooLargeError();
    }

    chunks.push(buffer);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://lead-validator.local");

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (
    request.method !== "POST" ||
    (url.pathname !== "/validate/lead" &&
      url.pathname !== "/validate/abstract-company" &&
      url.pathname !== "/score-lead")
  ) {
    sendJson(response, 404, {
      error: {
        code: "NOT_FOUND",
        message: "La ruta solicitada no existe.",
      },
    });
    return;
  }

  if (!request.headers["content-type"]?.includes("application/json")) {
    sendJson(response, 415, {
      error: {
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "El body debe usar Content-Type application/json.",
      },
    });
    return;
  }

  try {
    const input = await readJsonBody(request);
    const validation =
      url.pathname === "/validate/lead"
        ? validateLeadEvent(input)
        : url.pathname === "/validate/abstract-company"
          ? validateAbstractCompanyEnrichmentResponse(input)
          : scoreLeadRequest(input);

    sendJson(response, validation.valid ? 200 : 422, validation);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      sendJson(response, 413, {
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "El body excede el límite de 64 KiB.",
        },
      });
      return;
    }

    if (error instanceof SyntaxError) {
      sendJson(response, 400, {
        error: {
          code: "INVALID_JSON",
          message: "El body no contiene JSON válido.",
        },
      });
      return;
    }

    throw error;
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Lead validator listening on port ${port}.`);
});
