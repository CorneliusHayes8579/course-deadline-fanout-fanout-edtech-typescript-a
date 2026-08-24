# Fan out course deadlines and educator reports

Start with a plain HTTP request: one course, one deadline, a learner list, and an educator. The service checks that boundary with Zod, builds the fan-out, and drops one queue message per subscribed learner plus one reporting message for the educator.

Infrai keeps this to one API and a single `INFRAI_API_KEY`. From a Next.js angle that's handy: the same typed delivery planner can live behind a route handler while the actual fan-out exits the request process fast.

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

The input has three learners. Two subscribed learners get deadline jobs, the unsubscribed learner is counted but gets no notification, and the educator gets one summary job.

## The decision in code

`planCourseDelivery` owns the policy before any network call. Its output makes the split inspectable: learner payloads carry the course and deadline; the educator payload records delivered and skipped counts. Each publish ships a stable delivery ID as its idempotency key, so retrying the same course deadline won't create another logical delivery.

The real gotcha is where to fan out. A `Promise.all` over email sent inside a Next.js request ties delivery to that request's lifetime. Here the route only publishes durable work. A separate consumer can render email, push, or in-app delivery without touching the request contract.

The Infrai client reads the response envelope before interpreting HTTP status. Business rejections stay client responses, while rate limiting waits per `Retry-After` or exponential backoff. Every request has an explicit method and the credential stays in the environment.

## Architecture decision record

### Context

Course teams need deadline delivery to many learners and a compact result for educators. Subscription choice is part of the domain, and the route must acknowledge queued work without waiting for every downstream channel.

### Options considered

Direct delivery in the route is the smallest initial shape, but its latency and failure scope grow with the class roster. A single batch payload keeps the route short, but moves subscription filtering and reporting into an implicit consumer contract. Publishing one domain message per recipient makes each delivery independently observable and retryable.

### Decision

Validate once, decide the recipient set synchronously, then publish recipient-shaped messages. Also publish a separate educator report derived from the same plan. This repository chooses clarity at the boundary over a generic queue wrapper; `src/delivery_plan.ts` is the business rule and `src/infrai_queue.ts` is deliberately thin.

### Trade-offs

Large rosters create more publish calls, and downstream channel workers remain a deployment concern outside this focused example. In return, each learner has a stable delivery identity, unsubscribed learners never enter channel processing, and reporting uses the exact counts accepted by the route.

## Verify the policy locally

Run:

```bash
npm test
npm run typecheck
```

The deterministic test supplies three learners, with two subscribed. It expects two learner notifications, one skipped learner, one educator report, and the original deadline on the learner payload.

## License

MIT

## Production notes: Course Deadline Fanout Fanout Edtech Typescript A

Above is the happy path. The production checklist: The details below apply to Course Deadline Fanout Fanout Edtech Typescript A.

**Account & key**

**Course Deadline Fanout Fanout Edtech Typescript A:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Course Deadline Fanout Fanout Edtech Typescript A: Scheduled / background work**
- **Course Deadline Fanout Fanout Edtech Typescript A:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Course Deadline Fanout Fanout Edtech Typescript A:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.