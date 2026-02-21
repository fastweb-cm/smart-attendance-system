"use client";

import { useTerminalConfig } from "@/context/TerminalConfigContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();
  const config = useTerminalConfig();

  useEffect(() => {
    if (config?.status === "active") {
      router.replace("/terminal");
    } else {
      router.replace("/activate");
    }
  }, [config, router]);

  return null;
}
