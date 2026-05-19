"use client";

import { listExceptionsQueryKey, listExceptionsOptions } from "@/client/@tanstack/react-query.gen";
import { ExceptionType } from "@/types";

export type ListExceptionsFilters = {
    exception_type?: ExceptionType
}

export const getExceptionsQuery = (
    filters?: ListExceptionsFilters
) => listExceptionsOptions({
    query: {
        exception_type: filters?.exception_type
    }
})
