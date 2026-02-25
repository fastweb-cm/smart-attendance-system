import { z } from "zod";
import { zUserCreate } from "@/client/zod.gen";

//users (staff, students) schema
export type createUserFormValues = z.infer<typeof zUserCreate>

export { zUserCreate }
