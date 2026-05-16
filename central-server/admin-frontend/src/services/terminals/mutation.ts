import { deleteTerminalMutation, createTerminalMutation, updateTerminalMutation } from "@/client/@tanstack/react-query.gen";

//delete a terminal

export const terminalMutation = () => deleteTerminalMutation();

// create a terminal
export const createTerminal = () => createTerminalMutation();

// update a terminal
export const updateTerminal = () => updateTerminalMutation();
