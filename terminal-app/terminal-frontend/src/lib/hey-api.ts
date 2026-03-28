import type { CreateClientConfig } from "@/client/facerecognition/client"

export const createClientConfig: CreateClientConfig = (config) => {
    const isCentral = config?.url?.startsWith('/central/');
    
    let finalUrl = config?.url;
    let finalBaseUrl = process.env.NEXT_PUBLIC_LOCAL_SERVICE_URL;

    if (isCentral) {
        finalBaseUrl = process.env.NEXT_PUBLIC_CENTRAL_API_URL;
        // Remove the virtual '/central' prefix before sending to the real server
        finalUrl = config?.url?.replace('/central', '');
    }

    return {
        ...config,
        url: finalUrl,
        baseURL: finalBaseUrl,
        withCredentials: true,
    };
}
