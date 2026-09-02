import {
  createGroupMutation,
  updateGroupMutation,
  addGroupMemberMutation,
  removeGroupMemberMutation,
} from "@/client/@tanstack/react-query.gen";

export const createGroupMut = () => ({
  ...createGroupMutation(),
});

export const updateGroupMut = () => ({
  ...updateGroupMutation(),
});

export const addGroupMemberMut = () => addGroupMemberMutation();

export const removeGroupMemberMut = () => removeGroupMemberMutation();
