"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Import face-api.js
import * as faceapi from "face-api.js";

interface WebcamCaptureModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WebcamCaptureModal({
  open,
  onClose,
}: WebcamCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [faceFeedback, setFaceFeedback] = useState<string | null>(null);

  // ==============================
  // Load face-api.js models
  // ==============================
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingModels(true);

        // Models folder served in public/models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);

        setLoadingModels(false);
      } catch (err) {
        console.error("Error loading face-api models:", err);
        setError("Failed to load face detection models.");
      }
    };

    loadModels();
  }, []);

  // ==============================
  // Stop webcam utility
  // ==============================
  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    // Stop detection interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  // ==============================
  // Handle face detection & capture
  // ==============================
  const handleVideoPlay = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Create overlay canvas
    const canvas = faceapi.createCanvasFromMedia(videoEl);
    canvas.classList.add("absolute", "top-0", "left-0");
    videoEl.parentElement?.appendChild(canvas);

    // Use actual video resolution
    const displaySize = { width: videoEl.videoWidth, height: videoEl.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    const detectFace = async () => {
      if (!videoEl) return;

      const detections = await faceapi
        .detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);

      if (detections.length === 0) {
        setFaceFeedback("No face detected. Please position your face in front of the camera.");
      } else if (detections.length > 1) {
        setFaceFeedback("Multiple faces detected. Only one person allowed.");
      } else {
        const box = detections[0].detection.box;

        // ==============================
        // Correct centering logic
        // ==============================
        const videoCenterX = videoEl.videoWidth / 2;
        const videoCenterY = videoEl.videoHeight / 2;

        const faceCenterX = box.x + box.width / 2;
        const faceCenterY = box.y + box.height / 2;

        const offsetX = Math.abs(videoCenterX - faceCenterX);
        const offsetY = Math.abs(videoCenterY - faceCenterY);

        const positionThreshold = 100; // pixels, can tweak

        if (offsetX > positionThreshold || offsetY > positionThreshold) {
          setFaceFeedback("Please center your face in the frame.");
        } else {
          setFaceFeedback(null);

          // ==============================
          // Auto capture
          // ==============================
          const captureCanvas = document.createElement("canvas");
          captureCanvas.width = videoEl.videoWidth;
          captureCanvas.height = videoEl.videoHeight;
          const captureCtx = captureCanvas.getContext("2d");
          captureCtx?.drawImage(videoEl, 0, 0, captureCanvas.width, captureCanvas.height);
          const capturedDataUrl = captureCanvas.toDataURL("image/png");

          stopWebcam();
          onClose();

          console.log("Captured face image:", capturedDataUrl);
        }
      }
    };

    // Start detection loop
    detectionIntervalRef.current = setInterval(detectFace, 300);

    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [onClose]);

  // ==============================
  // Start webcam stream
  // ==============================
  useEffect(() => {
    if (!open || loadingModels) return;

    const startWebcam = async () => {
      try {
        setError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        streamRef.current = mediaStream;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          // Wait until metadata is loaded before calling handleVideoPlay
          if (videoRef.current.readyState < 2) {
            videoRef.current.onloadedmetadata = handleVideoPlay;
          } else {
            handleVideoPlay();
          }
        }
      } catch (err) {
        console.error(err);
        setError("Unable to access webcam. Please allow permission.");
      }
    };

    startWebcam();

    return () => {
      stopWebcam();
      if (videoRef.current) videoRef.current.onloadedmetadata = null;
    };
  }, [open, loadingModels, handleVideoPlay]);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle>Record Attendance</DialogTitle>
          <DialogDescription>
            Position your face inside the frame.
          </DialogDescription>
        </DialogHeader>

        {error && <div className="mt-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm">{error}</div>}

        {!error && (
          <div className="mt-6 flex flex-col items-center gap-4 relative">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-md h-64 object-cover rounded-xl bg-black shadow-md"
                onPlay={handleVideoPlay}
              />
              <span className="absolute top-3 right-3 px-3 py-1 text-xs bg-green-500 text-white rounded-full shadow">
                ● Live
              </span>
            </div>
            {faceFeedback && <div className="mt-2 text-sm text-yellow-600">{faceFeedback}</div>}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={() => { stopWebcam(); onClose(); }}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
