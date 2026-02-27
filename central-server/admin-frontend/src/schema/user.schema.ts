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
