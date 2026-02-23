import { z } from "zod"

export const loginSchema = z.object({
    username: z.string().min(3, "Username must be atleast 3 characters minimum"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

export type LoginFormValues = z.infer<typeof loginSchema>
