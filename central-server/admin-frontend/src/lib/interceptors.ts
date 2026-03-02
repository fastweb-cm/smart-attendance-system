
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

    if (!error.response) {
      return Promise.reject(error);
    }

    //guard: if config is missing
    if(!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const message = error.response.data.message;

    // only refresh if access token expired
    if (status === 401 && message === "Access token expired" &&
       !originalRequest.url?.includes("/logout") && 
       !originalRequest.url?.includes("/login") &&
       !originalRequest.url?.includes("/refresh")
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = client.instance.post("/api/v1/auth/refresh")
          .then(res => {
            const newToken = res.data.accessToken;
            tokenStore.set(newToken);
            return newToken;
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      try {
        const newAccessToken = await refreshPromise;

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newAccessToken}`,
        };

        return client.instance(originalRequest);
      } catch {
        tokenStore.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
