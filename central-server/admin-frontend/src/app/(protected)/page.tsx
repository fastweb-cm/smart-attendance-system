"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      router.replace("/admin");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null; // or loading spinner
}
