import { createUserMutation, deleteUserMutation, syncUsersMutation } from "@/client/@tanstack/react-query.gen";

//create a new user (staff or student)

export const userMutation = () => createUserMutation();
export const sycUsersMutation = () => syncUsersMutation();
export const deleteUserMut = () => deleteUserMutation()
