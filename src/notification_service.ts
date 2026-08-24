import { createServer, type ServerResponse } from "node:http";
import { ZodError } from "zod";
import { courseNotificationSchema, planCourseDelivery } from "./delivery_plan.js";
import { infrai, InfraiError } from "./infrai_queue.js";

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

async function readJson(request: AsyncIterable<Buffer | string>): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/notifications/course") {
    json(response, 404, { error: "Route not found" });
    return;
  }

  try {
    const input = courseNotificationSchema.parse(await readJson(request));
    const plan = planCourseDelivery(input);
    await Promise.all(
      plan.deliveries.map((delivery) =>
        infrai.queue.publish(delivery.payload, delivery.deliveryId),
      ),
    );
    json(response, 202, { status: "queued", ...plan.result });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      json(response, 400, { error: "Invalid request body" });
      return;
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      json(response, status, { error: error.message, code: error.code });
      return;
    }
    json(response, 502, { error: "Notification queue request failed" });
  }
});

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, () => console.log(`Course notification service listening on ${port}`));
}
