import z from "zod";

export const PermissionFormSchema = z
  .object({
    id: z.number().optional(),

    user_id: z
      .number({ error: "Employee identification target is required." })
      .min(1, { message: "A valid Employee target must be selected." }),

    permission_type_id: z
      .number({ error: "Permission leave type classification is required." })
      .min(1, { message: "Please select a valid permission leave category choice." }),

    reason: z
      .string({ error: "A valid justification statement is required." })
      .min(10, { message: "Reason statement must contain at least 10 descriptive characters." })
      .max(500, { message: "Justification statement cannot exceed 500 characters." }),

    initiatedby: z
      .number()
      .min(1, { message: "Initiator identity footprint context is required." }),

    start_date: z
      .string({ error: "Effective permission start date is required." })
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date format configuration must follow YYYY-MM-DD." }),

    end_date: z
      .string({ error: "Effective permission validation end date is required." })
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date format configuration must follow YYYY-MM-DD." }),
  })
  // Refined boundary check replacing the old single .refine block
  .superRefine((data, ctx) => {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Rule Check: Start date cannot be in the past
    if (data.start_date < todayStr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The permission start date cannot be set in the past.",
        path: ["start_date"],
      });
    }

    // 2. Rule Check: End date cannot be in the past
    if (data.end_date < todayStr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The permission end date cannot be set in the past.",
        path: ["end_date"],
      });
    }

    // 3. Rule Check: Sequential matching
    if (data.end_date < data.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Effective termination date cannot be configured prior to the starting timeline.",
        path: ["end_date"],
      });
    }
  });

export type PermissionFormValues = z.infer<typeof PermissionFormSchema>;
