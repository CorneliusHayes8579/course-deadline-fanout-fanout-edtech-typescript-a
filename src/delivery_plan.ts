import { z } from "zod";

export const courseNotificationSchema = z.object({
  course: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
  }),
  deadline: z.string().datetime({ offset: true }),
  learners: z.array(
    z.object({
      id: z.string().min(1),
      email: z.string().email(),
      subscribed: z.boolean(),
    }),
  ).min(1),
  educator: z.object({
    id: z.string().min(1),
    email: z.string().email(),
  }),
});

export type CourseNotification = z.infer<typeof courseNotificationSchema>;

export type QueueDelivery = {
  deliveryId: string;
  payload: Record<string, unknown>;
};

export type DeliveryPlan = {
  deliveries: QueueDelivery[];
  result: {
    courseId: string;
    learnerNotifications: number;
    skippedLearners: number;
    educatorReports: number;
  };
};

export function planCourseDelivery(input: CourseNotification): DeliveryPlan {
  const subscribed = input.learners.filter((learner) => learner.subscribed);
  const learnerDeliveries = subscribed.map((learner) => ({
    deliveryId: `course-${input.course.id}-deadline-${input.deadline}-learner-${learner.id}`,
    payload: {
      kind: "learner_deadline",
      course: input.course,
      deadline: input.deadline,
      learner: { id: learner.id, email: learner.email },
    },
  }));

  const report = {
    deliveryId: `course-${input.course.id}-deadline-${input.deadline}-educator-${input.educator.id}`,
    payload: {
      kind: "educator_delivery_report",
      course: input.course,
      deadline: input.deadline,
      educator: input.educator,
      learnerNotifications: subscribed.length,
      skippedLearners: input.learners.length - subscribed.length,
    },
  };

  return {
    deliveries: [...learnerDeliveries, report],
    result: {
      courseId: input.course.id,
      learnerNotifications: subscribed.length,
      skippedLearners: input.learners.length - subscribed.length,
      educatorReports: 1,
    },
  };
}
