import { createTerminal } from "@/client";
import { queryClient } from "@/lib/queryClient";
import { TerminalCreateFormValues, TerminalCreateSchema } from "@/schema/terminal.schema";
import { terminalMutation } from "@/services/terminals/mutation";
import { getTerminalsQuery, ListTerminalsFilters, terminalsQueryKey } from "@/services/terminals/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

// get all terminals with optional filters
export const useTerminals = (
    filters?: ListTerminalsFilters
) => useQuery({
    ...getTerminalsQuery(filters),
    queryKey: terminalsQueryKey(filters),
    select: (response) => response.data
})


// delete a terminal
export const useDeleteTerminal = () => {
    return useMutation({
        ...terminalMutation(),
        onSuccess: (res) => {
            toast.success(res.message || "Terminal deleted successfully");
        },
        onSettled: async () => {
            //invalidate the list of terminals after deletion
            const queryKey = terminalsQueryKey();
            await queryClient.invalidateQueries({ queryKey })
        },
        onError: (error) => {
            toast.error("Failed to delete terminal")
        }
    })
}

// create a terminal
export const useCreateTerminal = () => {
    return useMutation({
        mutationFn: async (data: { body: TerminalCreateFormValues }) => {
            const response = await createTerminal(data);
            return response.data;
        },
        onSuccess: (res) => {
            toast.success(res?.message || "Terminal created successfully");
        },
        onSettled: async () => {
            //invalidate the list of terminals after creation
            const queryKey = terminalsQueryKey();
            await queryClient.invalidateQueries({ queryKey })
        },
        onError: (error) => {
            toast.error("Failed to create terminal")
        }
    })
}
