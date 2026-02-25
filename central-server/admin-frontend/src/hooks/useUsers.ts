import { getUsersQuery } from "@/services/users/queries"
import { useQuery } from "@tanstack/react-query"

export const useUsers = () => 
    useQuery({
        ...getUsersQuery(),
    })
