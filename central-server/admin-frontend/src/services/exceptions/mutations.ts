import { deleteExceptionMutation, createExceptionMutation } from "@/client/@tanstack/react-query.gen";

export const deleteExceptionMut = () => deleteExceptionMutation();

export const upsertExceptionMut = () => createExceptionMutation();
