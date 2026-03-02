// let accessToken: string | null = null;

// export const tokenStore = {
//   get: () => accessToken,
//   set: (token: string) => {
//     accessToken = token;
//   },
//   clear: () => {
//     accessToken = null;
//   },
// };

export const tokenStore = {
  get: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  },
  set: (token: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("access_token", token);
  },
  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
  },
};
