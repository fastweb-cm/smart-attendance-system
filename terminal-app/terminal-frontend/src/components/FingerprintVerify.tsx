"use client";

import { useEffect, useRef } from "react";
import apiClient from "@/lib/axiosClient";
import { FingerPrintProps } from "@/types";

export default function FingerprintVerify({
  open, onClose, onResult, onFeedback,
  userId, terminal_id, auth_type_id, action,
}: FingerPrintProps) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Always call the LATEST callbacks without making them effect dependencies
  const onCloseRef = useRef(onClose);
  const onResultRef = useRef(onResult);
  const onFeedbackRef = useRef(onFeedback);
  useEffect(() => {
    onCloseRef.current = onClose;
    onResultRef.current = onResult;
    onFeedbackRef.current = onFeedback;
  });

  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    const closeStream = () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };

    const start = async () => {
      try {
        const formData = new FormData();
        formData.append("action", action || "VERIFY");
        if (terminal_id) formData.append("terminal_id", terminal_id.toString());
        if (userId) formData.append("user_id", userId.toString());
        if (auth_type_id) formData.append("auth_type_id", auth_type_id.toString());

        const startRes = await apiClient.post("verify/fingerprint/session/start", formData);
        const { session_id } = startRes.data;

        if (!isMounted) {   // unmounted while the request was in flight
          apiClient.post(`verify/fingerprint/session/cancel/${session_id}`).catch(() => {});
          return;
        }
        sessionIdRef.current = session_id;

        const baseUrl = process.env.NEXT_PUBLIC_LOCAL_SERVICE_URL || "http://localhost:8085";
        const es = new EventSource(`${baseUrl}/verify/fingerprint/session/stream/${session_id}`);
        eventSourceRef.current = es;

        const feedback = (e: Event) => {
          const d = JSON.parse((e as MessageEvent).data);
          onFeedbackRef.current(d.hint || "Place finger on scanner");
        };
        es.addEventListener("waiting", feedback);
        es.addEventListener("enroll_required", feedback);

        es.addEventListener("enroll_progress", (e) => {
          const d = JSON.parse((e as MessageEvent).data);
          onFeedbackRef.current(`Scan ${d.stage}/${d.total}: ${d.hint}`);
        });
        es.addEventListener("attempt_failed", (e) => {
          const d = JSON.parse((e as MessageEvent).data);
          onFeedbackRef.current(`Attempt ${d.attempt}/${d.max}: ${d.hint}`);
        });

        es.addEventListener("success", (e) => {
          const d = JSON.parse((e as MessageEvent).data);
          closeStream();
          onCloseRef.current();
          onResultRef.current("success", "Fingerprint verified successfully.", d.user,
            d.attendance_status, d.next_step ?? null, d.attendance_type ?? null);
        });

        es.addEventListener("failed", (e) => {
          const d = JSON.parse((e as MessageEvent).data);
          closeStream();
          onCloseRef.current();
          onResultRef.current("error", d.reason || "Fingerprint verification failed.");
        });

        // "error" is both our server-sent event and the browser's connection error
        es.addEventListener("error", (e) => {
          const raw = (e as MessageEvent).data;
          closeStream();
          if (raw) {   // sent by the backend
            onCloseRef.current();
            onResultRef.current("error", JSON.parse(raw).message || "Fingerprint scanner error.");
          }
        });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (!isMounted) return;
        onCloseRef.current();
        onResultRef.current("error", error.response?.data?.detail || "Failed to initialize fingerprint scanner.");
      }
    };

    start();

    return () => {
      isMounted = false;
      closeStream();
      const sid = sessionIdRef.current;
      sessionIdRef.current = null;
      if (sid) apiClient.post(`verify/fingerprint/session/cancel/${sid}`).catch(() => {});
    };
    // ONLY inputs that should restart a session. Never the callbacks.
  }, [open, userId, terminal_id, auth_type_id, action]);

  return null;
}
