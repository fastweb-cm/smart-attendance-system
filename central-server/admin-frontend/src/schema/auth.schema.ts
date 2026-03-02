import { z } from "zod"
import { zLogin } from "@/client/zod.gen";

export const loginSchema = zLogin.extend({
    username: z.string().min(3, "Username is required"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

export type LoginFormValues = z.infer<typeof loginSchema>
