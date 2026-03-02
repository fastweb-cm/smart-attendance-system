"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthCheck() {
const { user, isHydrating } = useAuth();
const router = useRouter();

useEffect(() => {
  if (!user && !isHydrating) {
    router.push("/login");
  }
  if(user && !isHydrating) {
    router.push('/admin');
  }
}, [user, router,isHydrating]);

if(isHydrating) return <div className="text-center">loading...</div>
if (!user) return null;

}
