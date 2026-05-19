import { EXCEPTION_TYPES } from "@/types";
import z from "zod"

export const ExceptionFormSchema = z
  .object({
    title: z
      .string({ error: "Title is required." })
      .min(2, { message: "Title must be at least 2 characters." })
      .max(120, { message: "Title must not exceed 120 characters." }),
    exception_type: z.enum(EXCEPTION_TYPES, {
      error: "Exception type is required.",
    }),
    description: z.string().max(500).optional(),
    created_by: z.number().min(1, { message: "Created by field is required" }),
    start_date: z
      .string({ error: "Start date is required." })
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Must be YYYY-MM-DD format." }),
    end_date: z
      .string({ error: "End date is required." })
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Must be YYYY-MM-DD format." }),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date cannot be prior to start date.",
    path: ["end_date"],
  });

export type ExceptionFormValues = z.infer<typeof ExceptionFormSchema>;
