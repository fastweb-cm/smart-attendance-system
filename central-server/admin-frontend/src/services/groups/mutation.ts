import {
  addGroupMemberMutation,
  removeGroupMemberMutation,
} from "@/client/@tanstack/react-query.gen";

export const addGroupMemberMut = () => addGroupMemberMutation();

export const removeGroupMemberMut = () => removeGroupMemberMutation();
