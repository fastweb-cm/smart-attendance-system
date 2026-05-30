import { z } from "zod";
import { zUserCreate, zUserResponse } from "@/client/zod.gen";

export const userCreateForm = zUserCreate.extend({
    fname: z.string().min(1, "First name is required"),
    lname: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),

})

//users (staff, students) schema
export type createUserFormValues = z.infer<typeof userCreateForm>

export type UserResponseType = z.infer<typeof zUserResponse>;

// shared base matrix across all institutional identities
const baseEmployeeSchema = z.object({
    id: z.number().optional(),
    fname: z.string().min(2, "First name must be at least 2 characters"),
    lname: z.string().min(2, "Last name must be at least 2 characters"),
    gender: z.enum(["male", "female"], { error: "Gender selection is required" }),

    // Allows valid length strings OR empty strings if omitted entirely
    username: z.string().min(3, "Username must be at least 3 characters").or(z.literal("")).optional(),
    password: z.string().min(6, "Password must be at least 6 characters").or(z.literal("")).optional(),

    status: z.enum(["active", "inactive", "dismissed"]).optional(),
    biometric_enrollment_status: z.enum(["pending", "completed"]).optional(),
    regno: z.string().optional(),
})

export const employeeCreateForm = z.discriminatedUnion("user_type", [
    // Student Rules: Class is required, Email is completely optional
    z.object({
        user_type: z.literal("student"),
        class_id: z.number({ error: "Please select an assigned class" }).min(1, "Please select an assigned class"),
        email: z.string().email("Invalid email address format").or(z.literal("")).nullable().optional(),
    }).merge(baseEmployeeSchema),

    // Staff Rules: Operational Role is required, Email is strictly mandatory
    z.object({
        user_type: z.literal("staff"),
        role_id: z.number({ error: "Please select a staff role" }).min(1, "Please select a staff role"),
        email: z.string({ error: "Email address is required for staff members" }).email("Invalid email address format"),
    }).merge(baseEmployeeSchema)
])

export type createEmployeeFormValues = z.infer<typeof employeeCreateForm>
