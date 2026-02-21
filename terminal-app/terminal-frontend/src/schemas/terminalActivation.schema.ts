import { z } from "zod"

export const terminalActivationSchema = z.object({
    activationCode: z.string().min(1, "Activation code is required")
});

export type TerminalActivationData = z.infer<typeof terminalActivationSchema>;
