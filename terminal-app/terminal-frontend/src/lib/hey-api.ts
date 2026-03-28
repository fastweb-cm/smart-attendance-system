import axios from 'axios';
import type { CreateClientConfig } from "@/client/facerecognition/client";

export const createClientConfig: CreateClientConfig = (config) => {
    // Create the instance. We cast 'config' to any here because 
    // Hey API's config object and Axios's config object have 
    // slight internal naming conflicts (like 'auth' or 'headers').
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = axios.create(config as any);

    // Attach the Interceptor for Dynamic Routing
    instance.interceptors.request.use((requestConfig) => {
        const url = requestConfig.url || '';
        const isCentral = url.startsWith('/central/');

        const centralBase = process.env.NEXT_PUBLIC_CENTRAL_API_URL;
        const localBase = process.env.NEXT_PUBLIC_LOCAL_SERVICE_URL;

        if (isCentral) {
            requestConfig.baseURL = centralBase;
            // Strip /central so PHP gets /terminal/activate
            requestConfig.url = url.replace(/^\/central/, '');
        } else {
            requestConfig.baseURL = localBase;
        }

        return requestConfig;
    });

    // Set global defaults on the instance
    instance.defaults.withCredentials = true;

    return {
        ...config,
        axios: instance,
    };
};
