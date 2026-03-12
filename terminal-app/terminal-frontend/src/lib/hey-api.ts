import type { CreateClientConfig } from "@/client/facerecognition/client"

export const createClientConfig: CreateClientConfig = (config) => ({
    ...config,
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    withCredentials: true,
})
