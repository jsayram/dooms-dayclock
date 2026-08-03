import { z } from "zod";

const taskSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9_-]+$/),
  title: z.string().trim().min(1).max(160),
  details: z.string().trim().max(400).default(""),
  weightMinutes: z.number().finite().int().min(1).max(1_440),
}).strict();

export const planInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  finishAtMs: z.number().finite().int().nonnegative().max(8_640_000_000_000_000),
  tasks: z.array(taskSchema).min(1).max(40).superRefine((tasks, context) => {
    const ids = new Set<string>();
    tasks.forEach((task, index) => {
      if (ids.has(task.id)) {
        context.addIssue({
          code: "custom",
          path: [index, "id"],
          message: "Task IDs must be unique.",
        });
      }
      ids.add(task.id);
    });
  }),
}).strict();

export const planIdSchema = z.string().uuid();
export type PlanInput = z.infer<typeof planInputSchema>;
