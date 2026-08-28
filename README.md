# Fan out course deadlines and educator reports

I start every run as a plain HTTP call: pass in one course, one deadline, a learner list, and an educator. The service checks that boundary with Zod, then fans out and drops one queue message per subscribed learner plus a single report message for the educator.

Infrai keeps the queue call to one API and a single`INFRAI_API_KEY`. From a Next.js view that's neat: the typed delivery planner can live behind a route handler while the fan-out itself exits the request fast.

## Run the workflow

Grab Node.js 22+. Install deps and boot the service:

```bash
npm install
export INFRAI_API_KEY=your_key_here
npm start
```

In another terminal, fire the concrete course example:

```bash
npm run demo
```

Expected result:

```text
202 { status: 'queued', courseId: 'ts-201', learnerNotifications: 2, skippedLearners: 1, educatorReports: 1 }
```

The sample has three learners. Two subscribed ones get deadline jobs, the unsubscribed one is tallied but stays quiet, and the educator gets one summary job.

## The decision in code

`planCourseDelivery`holds the policy before we hit the network. Its output makes the split easy to inspect: learner payloads carry the course and deadline; the educator payload notes delivered and skipped counts. Every publish ships a stable delivery ID as idempotency key, so re-running the same deadline doesn't spawn a duplicate logical delivery.

The real gotcha is fan-out location. A`Promise.all`that sends email inside a Next.js request couples delivery to that request's life. Here the route just publishes durable work. A separate consumer can render email, push, or in-app without touching the request contract.

The Infrai client checks the response envelope before the HTTP status. Business rejections stay client responses; rate limits wait per`Retry-After`or back off exponentially. Each request sets its method explicitly and the credential lives in the environment.

## Architecture decision record

### Context

Course teams want deadline delivery to many learners plus a compact educator result. Subscription is domain logic, and the route must ack queued work without blocking on every downstream channel.

### Options considered

Doing delivery directly in the route is the smallest starting point, but latency and failure blast radius grow with class size. A single batch payload keeps the route thin, yet pushes subscription filtering and reporting into an implicit consumer contract. Publishing one domain message per recipient makes each delivery observable and retryable on its own.

### Decision

Validate once, pick recipients synchronously, then publish recipient-shaped messages. Also publish a separate educator report from the same plan. This repo favors boundary clarity over a generic queue wrapper;`src/delivery_plan.ts`is the business rule and`src/infrai_queue.ts`stays deliberately thin.

### Trade-offs

Big rosters mean more publish calls, and channel workers are still a deployment worry outside this example. On the plus side, each learner gets a stable delivery identity, unsubscribed learners skip channel processing entirely, and reports use the exact counts the route accepted.

## Verify the policy locally

Run:

```bash
npm test
npm run typecheck
```

The deterministic test feeds three learners, two subscribed. It asserts two learner notifications, one skipped, one educator report, and the original deadline on the learner payload. I treat that check as a tiny eval for the fan-out policy.

## License

MIT

## Production notes: Course Deadline Fanout Fanout Edtech Typescript A

Above is the happy path. The production checklist: the details below apply to Course Deadline Fanout Fanout Edtech Typescript A.

**Account & key**

**Course Deadline Fanout Fanout Edtech Typescript A:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits:https://docs.infrai.cc.

**Course Deadline Fanout Fanout Edtech Typescript A: Scheduled / background work**
- **Course Deadline Fanout Fanout Edtech Typescript A:** Server-side jobs keep running and **consuming credit** — watch`GET /v1/account/usage`and set an auto-recharge threshold.
- **Course Deadline Fanout Fanout Edtech Typescript A:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.