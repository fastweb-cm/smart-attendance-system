
import { client } from "@/client/client.gen";
import { tokenStore } from "./token-store";
import { AxiosHeaders } from "axios";


let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Attach Access Token
client.instance.interceptors.request.use((config) => {
  const token = tokenStore.get();

  if (token) {
    if(!config.headers) {
      config.headers = new AxiosHeaders();
    }

    (config.headers as AxiosHeaders).set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  return config;
});

// 🔹 Handle 401 + Refresh + Retry
client.instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const message = error.response.data.message;

    // If a protected route throws a 401 because the access token finally expired
    if (status === 401 && message === "Access token expired" &&
       !originalRequest.url?.includes("/auth/refresh") &&
       !originalRequest.url?.includes("/auth/login")
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        
        // Trigger the backend rotation endpoint using the HttpOnly cookie
        refreshPromise = client.instance.post("/api/v1/auth/refresh", {}, { withCredentials: true })
          .then(res => {
            const newToken = res.data.accessToken;
            tokenStore.set(newToken); // Save new token
            return newToken;
          })
          .catch(err => {
            tokenStore.clear();
            // Do not use window.location.href here; let your React state throw the user out
            return Promise.reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      try {
        // Wait for the token swap to complete
        const newAccessToken = await refreshPromise;

        // Re-attach the fresh token to the failed request's headers
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // Retry the original user request (e.g., fetch branches) smoothly!
        return client.instance(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    return Promise.reject(error);
  }
);
