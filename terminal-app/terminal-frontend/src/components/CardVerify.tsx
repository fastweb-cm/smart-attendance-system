"use client";

import { AuthProps } from "@/types";
import apiClient from "@/lib/axiosClient";
import { useEffect, useRef } from "react";
import { CreditCard } from "lucide-react";

export default function CardVerify({ onResult, ...props }: AuthProps) {
  // Use a ref for the buffer so it doesn't trigger re-renders while typing
  const bufferRef = useRef<string>("");

  const handleRequest = async (serial: string) => {
    console.log("Card serial read:", serial);
    try {
      const res = await apiClient.post("verify/card", {
        serial,
        user_id: props?.userId,
        auth_type: props?.authType,
        terminal_id: props?.terminalId,
        auth_type_id: props?.authTypeId,
        attendanceType: props?.attendanceType
      });

      if (res.data.verified) {
        onResult(
          "success",
          "Verification successful.",
          res.data?.user,
          res.data?.attendance_status,
          res.data?.next_step ?? null,
          res.data?.attendance_type ?? null
        );
      } else {
        onResult("error", `Verification failed.`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' 
        ? detail 
        : (Array.isArray(detail) ? detail[0].msg : "Verification failed");

      onResult("error", errorMsg);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if the user is typing in a specific input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "Enter") {
        if (bufferRef.current.length > 0) {
          handleRequest(bufferRef.current);
          bufferRef.current = ""; // Clear buffer after request
        }
      } else {
        // Filter out non-character keys (like Shift, Control, etc.)
        if (e.key.length === 1) {
          bufferRef.current += e.key;
        }
      }

      // Optional: Clear buffer if no key pressed for 200ms 
      // (Helps prevent manual keyboard typing from being confused with a card read)
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
        <CreditCard className="text-blue-600 w-12 h-12" />
      </div>
      <p className="mt-4 font-bold text-slate-600">Please scan your card</p>
      {/* Hidden indicator to show the app is listening */}
      <span className="sr-only">Ready for card input</span>
    </div>
  );
}
