"use client";

import { listUsersQueryKey, listUsersOptions } from "@/client/@tanstack/react-query.gen";

export const getUsersQuery = () => 
    listUsersOptions();

export const userQuery = listUsersQueryKey;
