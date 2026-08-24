import assert from "node:assert/strict";
import test from "node:test";
import { planCourseDelivery } from "../src/delivery_plan.js";

test("fans out to subscribers and gives the educator an exact delivery report", () => {
  const plan = planCourseDelivery({
    course: { id: "algebra-2", title: "Algebra II" },
    deadline: "2026-10-10T16:00:00Z",
    learners: [
      { id: "a", email: "a@example.edu", subscribed: true },
      { id: "b", email: "b@example.edu", subscribed: false },
      { id: "c", email: "c@example.edu", subscribed: true },
    ],
    educator: { id: "teacher", email: "teacher@example.edu" },
  });

  assert.deepEqual(plan.result, {
    courseId: "algebra-2",
    learnerNotifications: 2,
    skippedLearners: 1,
    educatorReports: 1,
  });
  assert.equal(plan.deliveries.length, 3);
  assert.deepEqual(
    plan.deliveries.map(({ payload }) => payload.kind),
    ["learner_deadline", "learner_deadline", "educator_delivery_report"],
  );
  assert.equal(plan.deliveries[0]?.payload.deadline, "2026-10-10T16:00:00Z");
});
