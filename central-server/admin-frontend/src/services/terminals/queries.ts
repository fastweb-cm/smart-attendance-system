'use client';

import { listTerminalsOptions, listTerminalsQueryKey } from "@/client/@tanstack/react-query.gen";

export type ListTerminalsFilters = {
    branch_id?: number,
    terminal_id?: number,
    status?: "active" | "pending" | "revoked" | null
}

export const getTerminalsQuery = (filters?: ListTerminalsFilters) => listTerminalsOptions({
    query: {
        branch_id: filters?.branch_id,
        terminal_id: filters?.terminal_id,
        status: filters?.status && ["active", "pending", "revoked"].includes(filters.status) ? filters.status : undefined
    }
})

export const terminalsQueryKey = (filters?: ListTerminalsFilters) => listTerminalsQueryKey({
    query: {
        branch_id: filters?.branch_id,
        terminal_id: filters?.terminal_id,
        status: filters?.status && ["active", "pending", "revoked"].includes(filters.status) ? filters.status : undefined
    }
})
