import { createUserMutation } from "@/client/@tanstack/react-query.gen";

//create a new user (staff or student)

export const userMutation = () => createUserMutation();
