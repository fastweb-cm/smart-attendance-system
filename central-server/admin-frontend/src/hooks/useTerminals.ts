import { createTerminal, getTerminalBySlug, updateTerminal } from "@/client";
import { queryClient } from "@/lib/queryClient";
import { TerminalCreateFormValues, TerminalCreateSchema } from "@/schema/terminal.schema";
import { terminalMutation } from "@/services/terminals/mutation";
import { getTerminalDetailsBySlugQuery, getTerminalsQuery, ListTerminalsFilters, terminalsQueryKey } from "@/services/terminals/queries";
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

//update a terminal
export const useUpdateTerminal = () => {
    return useMutation({
        mutationFn: async (data: { body: TerminalCreateFormValues }) => {
            const response = await updateTerminal(data);
            return response.data;
        },
        onSuccess: (res) => {
            toast.success(res?.message || "Terminal updated successfully");
        },
        onSettled: async (data, error, variables) => {
            // 1. Invalidate the primary table listing view cache
            const listQueryKey = terminalsQueryKey();
            await queryClient.invalidateQueries({ queryKey: listQueryKey });

            // 2. Extract the updated slug dynamically from the payload variables
            const updatedSlug = variables?.body?.terminalDetails?.slug;

            if (updatedSlug) {
                // 3. Clear out the specific details profile cache for this individual slug
                await queryClient.invalidateQueries({ 
                    queryKey: ["terminal", "details", updatedSlug] 
                });
            }
        },
        onError: (error) => {
            toast.error("Failed to update terminal")
        }
    })
}

// get initial terminal data by slug for editing
export const useTerminalDetailsBySlug = (slug: string) => {
    return useQuery({
        // Maintain the structured query key identity context tracking
        queryKey: ["terminal", "details", slug],
        // Explicitly define the execution handler utilizing the schema input variables
        queryFn: async (): Promise<TerminalCreateFormValues> => {
            const response = await getTerminalBySlug({
                path: { slug }
            });
            return response.data as TerminalCreateFormValues;
        },
        
        // 3. Keep option configurations active or fall back cleanly
        select: (response: TerminalCreateFormValues) => response,
        enabled: !!slug, // Prevents executing query if slug is currently undefined during initial mount
    });
}
