"use client";

import { AuthProps } from "@/types";
import apiClient from "@/lib/axiosClient";
import { useEffect, useRef, useState } from "react";
import { Fingerprint } from "lucide-react";

const MAX_RETRIES = 3;

export default function FingerprintVerify({ onResult, onFeedback, ...props }: AuthProps) {
  const [status, setStatus] = useState<"scanning" | "retrying" | "error">("scanning");
  const attemptRef = useRef(0);
  const hasFiredRef = useRef(false); // guards against double-fire in React strict mode / re-renders

  const runScan = async () => {
    setStatus("scanning");
    onFeedback?.("Place your finger on the scanner...");

    try {
      const form = new FormData();
      if (props?.userId) form.append("user_id", props.userId.toString());
      if (props?.terminalId) form.append("terminal_id", props.terminalId.toString());
      if (props?.authType) form.append("auth_type", props.authType);
      if (props?.authTypeId) form.append("auth_type_id", props.authTypeId.toString());

      const res = await apiClient.post("verify/fingerprint", form);

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
        handleRetryableFailure("Fingerprint not recognized.");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const httpStatus = error.response?.status;
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === "string"
        ? detail
        : (Array.isArray(detail) ? detail[0].msg : "Fingerprint scan failed");

      // 408 = no finger was placed in time — this is expected/common, retry silently.
      // 503 = reader hardware not found — this is fatal, don't retry.
      if (httpStatus === 408) {
        handleRetryableFailure(errorMsg);
      } else if (httpStatus === 503) {
        setStatus("error");
        onResult("error", errorMsg);
      } else if (httpStatus === 404) {
        // user not found (only relevant in identify-only / user_id flows)
        onResult("error", errorMsg);
      } else {
        handleRetryableFailure(errorMsg);
      }
    }
  };

  const handleRetryableFailure = (msg: string) => {
    attemptRef.current += 1;
    if (attemptRef.current >= MAX_RETRIES) {
      setStatus("error");
      onResult("error", `${msg} Too many attempts.`);
      return;
    }
    setStatus("retrying");
    onFeedback?.(`${msg} Retry ${attemptRef.current}/${MAX_RETRIES}`);
    setTimeout(runScan, 800);
  };

  useEffect(() => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;
    runScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
          status === "error" ? "bg-rose-100" : "bg-blue-100 animate-pulse"
        }`}
      >
        <Fingerprint className={`w-12 h-12 ${status === "error" ? "text-rose-600" : "text-blue-600"}`} />
      </div>
      <p className="mt-4 font-bold text-slate-600">
        {status === "error" ? "Scan failed" : "Scan your finger"}
      </p>
      <span className="sr-only">Ready for fingerprint input</span>
    </div>
  );
}
