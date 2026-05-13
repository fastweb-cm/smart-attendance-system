import { queryClient } from "@/lib/queryClient";
import { terminalMutation } from "@/services/terminals/mutation";
import { getTerminalsQuery, ListTerminalsFilters, terminalsQueryKey } from "@/services/terminals/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

// get all users
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
