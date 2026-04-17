import { zTerminal, zTerminalAccessPolicy, zTerminalCapabilities } from "@/client/zod.gen";
import z, { number } from "zod";

export const TerminalCapabilitiesSchema = zTerminalCapabilities.extend({

})

export const TerminalAccessPolicySchema = zTerminalAccessPolicy.refine(
    (obj) => !!obj.group_id || !!obj.subgroup_id,
    {
        message: "Either group or subgroup must be selected"
    }
);

export const TerminalDetailsSchema = zTerminal.extend({
    name: z.string().min(3, "Please enter a name for this terminal"),
    branch_id: z.number().min(1, "Please select a branch"),
})

export const TerminalCreateSchema = z.object({
    terminalDetails: TerminalDetailsSchema,
    authCapabilities: z.array(TerminalCapabilitiesSchema).min(1, "Select at least one authentication type"),
    authPolicies: z.array(TerminalAccessPolicySchema).optional()
})

export type TerminalCreateFormValues = z.infer<typeof TerminalCreateSchema>;
