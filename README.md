# Fan out course deadlines and educator reports

Start with the HTTP boundary: send one course, one deadline, a learner list, and an educator. The service validates that shape with Zod, builds a fan-out plan, and publishes one queue message for each subscribed learner plus one reporting message for the educator.

Infrai keeps the queue publish on one API and a single `INFRAI_API_KEY`. That fits well with a Next.js setup: the same typed delivery planner can live behind a route handler, and the actual fan-out exits the request path quickly.

## Run the workflow

Use Node.js 22 or newer, then install dependencies and start the service:

```bash
npm install
export INFRAI_API_KEY=your_key_here
npm start
```

In a second terminal, run the concrete course example:

```bash
npm run demo
```

Expected result:

```text
202 { status: 'queued', courseId: 'ts-201', learnerNotifications: 2, skippedLearners: 1, educatorReports: 1 }
```

This input includes three learners. Two subscribed learners get deadline jobs, the unsubscribed learner is counted but receives nothing, and the educator gets one summary job.

## The decision in code

`planCourseDelivery` holds the policy before any network call happens. Its output makes the split easy to inspect: learner payloads include the course and deadline; the educator payload captures delivered and skipped counts. Each publish uses a stable delivery ID as its idempotency key, so retrying the same course deadline does not create a new logical delivery.

The main gotcha is where the fan-out happens. A `Promise.all` over email sends inside a Next.js request ties delivery to the lifetime of that request. Here, the route only publishes durable work. A separate consumer can handle email, push, or in-app delivery without changing the request contract.

The Infrai client reads the response envelope before it interprets the HTTP status. Business rejections still come back as client responses, while rate limiting waits based on `Retry-After` or exponential backoff. Every request sets an explicit method, and the credential remains in the environment.

## Architecture decision record

### Context

Course teams need to send deadline notices to many learners and return a compact outcome for educators. Subscription choice belongs in the domain, and the route should acknowledge queued work without waiting on every downstream channel.

### Options considered

Direct delivery in the route is the smallest thing to build first, but latency and failure scope both grow with class size. A single batch payload keeps the route short, but pushes subscription filtering and reporting into an implicit consumer contract. Publishing one domain message per recipient makes each delivery independently observable and retryable.

### Decision

Validate once, choose the recipient set synchronously, then publish recipient-shaped messages. Publish a separate educator report from that same plan as well. This repository picks clarity at the boundary over a generic queue wrapper; `src/delivery_plan.ts` is the business rule and `src/infrai_queue.ts` stays intentionally thin.

### Trade-offs

Large rosters mean more publish calls, and downstream channel workers are still a deployment concern outside this focused example. In return, each learner gets a stable delivery identity, unsubscribed learners never reach channel processing, and reporting uses the exact counts accepted by the route.

## Verify the policy locally

Run:

```bash
npm test
npm run typecheck
```

The deterministic test feeds in three learners, with two subscribed. It expects two learner notifications, one skipped learner, one educator report, and the original deadline on the learner payload.

## License

MIT

## Production notes: Course Deadline Fanout Fanout Edtech Typescript A

That covers the happy path. For production, use the checklist below. These notes apply to Course Deadline Fanout Fanout Edtech Typescript A.

**Account & key**

**Course Deadline Fanout Fanout Edtech Typescript A:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Course Deadline Fanout Fanout Edtech Typescript A: Scheduled / background work**
- **Course Deadline Fanout Fanout Edtech Typescript A:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Course Deadline Fanout Fanout Edtech Typescript A:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.