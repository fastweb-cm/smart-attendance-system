"use client";

import { AuthProps } from "@/types";
import apiClient from "@/lib/axiosClient";
import { useEffect, useRef } from "react";
import { CreditCard } from "lucide-react";

export default function CardVerify({ onResult, ...props }: AuthProps) {
  const bufferRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // Ignore if the user is actively inside an input element elsewhere
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Clear any pending timeout because the reader is actively streaming keys
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Filter out utility keys (Shift, Control, Enter, etc.)
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // INSTANT TRIGGER: Once it hits exactly 8 characters, dispatch it!
        if (bufferRef.current.length === 8) {
          handleRequest(bufferRef.current);
          bufferRef.current = ""; // Reset buffer immediately
          return; // Exit early to prevent timeout creation
        }
      }

      // GUARD: If typing breaks for more than 200ms, assume a failed scan or manual typing
      timeoutRef.current = setTimeout(() => {
        if (bufferRef.current.length > 0) {
          console.log("Scanner timeout reached. Clearing partial buffer:", bufferRef.current);
          bufferRef.current = ""; 
        }
      }, 1000);
    };

    window.addEventListener("keydown", handleKeyDown);
    
    // Clean up event listeners and active timers on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [props]); // Dependency added to keep closure props fresh

  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
        <CreditCard className="text-blue-600 w-12 h-12" />
      </div>
      <p className="mt-4 font-bold text-slate-600">Please scan your card</p>
      <span className="sr-only">Ready for card input</span>
    </div>
  );
}
