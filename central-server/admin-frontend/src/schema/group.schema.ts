import { z } from "zod";

export const GroupDetailsSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, "Please enter a group name"),
  branch_id: z.coerce.number().min(1, "Please select a branch"),
  grouptype_id: z.coerce.number().min(1, "Please select a group type"),
  expected_weekly_hours: z.coerce.number().min(1, "Expected weekly hours required"),
  absence_threshold: z.coerce.number().min(0, "Absence threshold required"),
});

export const GroupCreateSchema = z.object({
  groupDetails: GroupDetailsSchema,
  member_ids: z.array(z.number()).default([]),
  supervisor_ids: z.array(z.number()).default([]),
});

// Use z.output to guarantee TypeScript sees strictly numbers for form values
export type GroupCreateFormValues = z.output<typeof GroupCreateSchema>;
