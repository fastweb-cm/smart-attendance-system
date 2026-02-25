import { queryClient } from "@/lib/queryClient"
import { userMutation } from "@/services/users/mutations"
import { getUsersQuery, userQueryKey } from "@/services/users/queries"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"

//get all users
export const useUsers = () => 
    useQuery({
        ...getUsersQuery(),
    })

//create user hook
export const useCreateUser = () =>
    useMutation({
        ...userMutation(),
        onSuccess: () =>
            toast.success("User registered successfully"),
        onError: (error) =>
            console.log(error.response?.status),
        // onSettled: async () =>
        //     await queryClient.invalidateQueries({ queryKey: userQueryKey() })
    })
