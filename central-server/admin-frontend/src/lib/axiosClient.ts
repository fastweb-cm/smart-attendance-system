import axios from "axios";

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    // Add this to allow cookies to pass cross-origin if your backend relies on them
    withCredentials: true, 
});

// Add a request interceptor to automatically inject headers dynamically
apiClient.interceptors.request.use(
    (config) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;
