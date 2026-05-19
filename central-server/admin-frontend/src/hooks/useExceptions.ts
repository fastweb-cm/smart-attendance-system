import { listExceptionsQueryKey } from "@/client/@tanstack/react-query.gen";
import { queryClient } from "@/lib/queryClient";
import { deleteExceptionMut, upsertExceptionMut } from "@/services/exceptions/mutations";
import { getExceptionsQuery, ListExceptionsFilters } from "@/services/exceptions/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

//get all exceptions
export const useExceptions = (
    filters?: ListExceptionsFilters
) => 
    useQuery({
        ...getExceptionsQuery(filters),
        queryKey: listExceptionsQueryKey({
            query: {
                exception_type: filters?.exception_type
            }
        }),
        select: (response) => response.data
    })

// delete exception
export const useDeleteException = () => {
    return useMutation({
        ...deleteExceptionMut(),
        onSuccess: (res) => {
            toast.success(res.message || "Exception deleted successfully");
        },
        onSettled: async () => {
            //invalidate the list of exceptions after deletion
            const queryKey = listExceptionsQueryKey();
            await queryClient.invalidateQueries({ queryKey })
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete exception")
        }
    })
}

// upsert exception
export const useUpsertException = () => {
    return useMutation({
        ...upsertExceptionMut(),
        onSuccess: (res) => 
            toast.success(res.message || "Exception saved successfully"),
        onSettled: async () => {
            //invalidate the list of exceptions after upsert
            const queryKey = listExceptionsQueryKey();
            await queryClient.invalidateQueries({ queryKey })
        },
        onError: (error) => {
            toast.error(error.message || "Failed to save exception")
        }
    })
}
