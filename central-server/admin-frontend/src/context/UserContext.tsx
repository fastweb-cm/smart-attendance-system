"use client";

import { User } from "@/types";
import React, { createContext, useContext, useEffect, useState } from "react";

// Create the context
const UserContext = createContext<User | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Ensure this runs only in browser
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        queueMicrotask(() => setUser(parsedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        queueMicrotask(() => setUser(null));
      }
    }
  }, []);

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
