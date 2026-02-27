"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
const { user, loading } = useAuth();
const router = useRouter();

useEffect(() => {
  if (!loading && !user) {
    router.push("/login");
  }
}, [user, loading, router]);

if (loading) return null; // wait until auth check finishes
if (!user) return null;   // prevent flash

}
