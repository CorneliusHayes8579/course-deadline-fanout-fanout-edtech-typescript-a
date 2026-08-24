export {};

const response = await fetch("http://localhost:3000/notifications/course", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    course: { id: "ts-201", title: "Practical TypeScript" },
    deadline: "2026-09-15T17:00:00Z",
    learners: [
      { id: "learner-17", email: "ava@example.edu", subscribed: true },
      { id: "learner-42", email: "noah@example.edu", subscribed: true },
      { id: "learner-63", email: "mia@example.edu", subscribed: false },
    ],
    educator: { id: "educator-8", email: "teacher@example.edu" },
  }),
});

console.log(response.status, await response.json());
