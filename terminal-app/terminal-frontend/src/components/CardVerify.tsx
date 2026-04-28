"use client";

import { AuthProps } from "@/types";
import apiClient from "@/lib/axiosClient";
import { useEffect } from "react";
import { CreditCard } from "lucide-react";

export default function CardVerify({
    onResult,
    ...props
}: AuthProps) {

  const handleRequest = async (serial: string) => {
    // Simulate card reading process
    // mock a card read and get the serial number
    // const cardSerialNumber = "1234567890"; // Replace with actual card serial number
    try {
      const res = await apiClient.post("verify/card", {
        serial,
        userId: props.userId,
        authType: props.authType,
        terminalId: props.terminalId,
        authTypeId: props.authTypeId,
        attendanceType: props.attendanceType
      });

      if (res.data.verified) {
        onResult(
          "success",
          "Verification successfull.",
          res.data?.user,
          res.data?.attendance_status,
          res.data?.next_step ?? null,
          res.data?.attendance_type ?? null
        );
      }else {
        onResult(
          "error",
          `Verification failed.`
        );
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      // Check if detail is a string or that weird FastAPI array
      const errorMsg = typeof detail === 'string' 
        ? detail 
        : (Array.isArray(detail) ? detail[0].msg : "Verification failed");

      onResult("error", errorMsg);
    }
  }

  // use an effect to listen for input automatically
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // logic to buffer characters from the card reader
      // Most readers end with "Enter" key, so we can listen for that to trigger the reading process
      if (e.key === "Enter") {
        handleRequest("1234567890");
      }
    }

    window.addEventListener("keydown", handleKeyPress);

    return () => { window.removeEventListener("keydown", handleKeyPress); };
  },[])

  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
        <CreditCard className="text-blue-600 w-12 h-12" />
      </div>
      <p className="mt-4 font-bold text-slate-600">Please scan your card</p>
    </div>
  );
}
