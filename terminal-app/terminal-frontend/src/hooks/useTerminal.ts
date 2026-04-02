import { activateMutation } from "@/services/mutations";
import { useMutation } from "@tanstack/react-query";

//activate terminal
export const useActivateTerminal = () => {
    return useMutation({
        ...activateMutation(),
    });
}
