import z from "zod";

export const PermissionReviewSchema = z.object({
  id: z.number({ error: "Target permission instance ID is required." }),
  
  status: z.enum(["approved", "rejected"], {
    message: "Please specify a definitive approval or rejection decision.",
  }),
  
  // Optional administrative feedback note
  review_notes: z
    .string()
    .max(500, { message: "Review notes cannot exceed 500 characters." })
    .optional()
    // Safe guard to handle empty text fields coming from native textareas cleanly
    .or(z.literal("")),
    
  reviewed_by: z
    .number()
    .min(1, { message: "Reviewer user signature identification is required." }),
});

export type PermissionReviewValues = z.infer<typeof PermissionReviewSchema>;
