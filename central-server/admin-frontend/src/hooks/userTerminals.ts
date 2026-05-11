import { getTerminalsQuery, ListTerminalsFilters, terminalsQueryKey } from "@/services/terminals/queries";
import { useQuery } from "@tanstack/react-query";

// get all users
export const useTerminals = (
    filters?: ListTerminalsFilters
) => useQuery({
    ...getTerminalsQuery(filters),
    queryKey: terminalsQueryKey(filters),
    select: (response) => response.data
})
