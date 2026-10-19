"use client";

import { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/axiosClient";
import { WebcamCaptureModalProps } from "@/types";

export default function WebcamCaptureModal({
  open,
  onClose,
  onCaptureStart,
  onResult,
  userId,
}: WebcamCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const capturedRef = useRef(false);

  const [loadingModels, setLoadingModels] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFrameValid, setIsFrameValid] = useState(false);

  const DETECTION_INTERVAL = 150; // Fast 6.6 FPS check loop
  const TOTAL_CAPTURES = 5; // 5 clean frames is more than enough for embedding generation

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        ]);
        setLoadingModels(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load face models.");
      }
    };
    load();
  }, []);

  const stopWebcam = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  /*
   Reasonable lighting safety check (replaces broken average brightness)
  */
  const checkLighting = (canvas: HTMLCanvasElement): boolean => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let totalLuminance = 0;
    const sampleStep = 16; // Speed up execution by sampling pixels

    for (let i = 0; i < pixels.length; i += 4 * sampleStep) {
      // Standard perceived luminance formula
      totalLuminance += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    }

    const avgLuminance = totalLuminance / (pixels.length / (4 * sampleStep));
    return avgLuminance >= 35; // Lower threshold to allow ambient room lighting
  };

  /*
   Capture loop with retry resilience
  */
  const captureMultiple = async (video: HTMLVideoElement) => {
    const embeddingsImages: Blob[] = [];
    let attempts = 0;

    while (embeddingsImages.length < TOTAL_CAPTURES && attempts < TOTAL_CAPTURES * 3) {
      attempts++;
      setFeedback(`Capturing template ${embeddingsImages.length + 1}/${TOTAL_CAPTURES}...`);

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Render unmirrored frame to sending canvas
        ctx.drawImage(video, 0, 0);

        if (!checkLighting(canvas)) {
          setFeedback("Environment too dark. Adjust room lighting.");
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }

        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.9)
        );

        if (blob) {
          embeddingsImages.push(blob);
        }
      }

      await new Promise((r) => setTimeout(r, 200)); // 200ms spacing between shots
    }

    if (embeddingsImages.length < TOTAL_CAPTURES) {
      capturedRef.current = false;
      setFeedback("Capture interrupted. Please try again.");
      return;
    }

    const formData = new FormData();
    formData.append("user_id", String(userId ?? 17));

    embeddingsImages.forEach((img) => {
      formData.append("images", img);
    });

    stopWebcam();
    onClose();
    onCaptureStart();

    try {
      await apiClient.post("enroll-face", formData);
      onResult("success", "Face template successfully registered.");
    } catch (error: any) {
      onResult("error", error.response?.data?.detail || "Face Registration failed");
    }
  };

  /*
   Detection Loop with relaxed thresholds
  */
  const detect = async () => {
    const video = videoRef.current;
    if (!video || capturedRef.current) return;

    const detection = await faceapi
      .detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 224, // Increased input size for better pose tolerance
          scoreThreshold: 0.4, // Lower score threshold so slight turns aren't ignored
        })
      )
      .withFaceLandmarks();

    if (!detection) {
      setFeedback("No face detected. Look at the camera.");
      setIsFrameValid(false);
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(detect);
      }, DETECTION_INTERVAL);
      return;
    }

    const box = detection.detection.box;

    // 1. Relaxed distance check (15% frame width instead of 25%)
    const faceWidthRatio = box.width / video.videoWidth;
    if (faceWidthRatio < 0.15) {
      setFeedback("Move slightly closer");
      setIsFrameValid(false);
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(detect);
      }, DETECTION_INTERVAL);
      return;
    }

    // 2. Relaxed centering check (30% bounding tolerance instead of 15%)
    const centerX = video.videoWidth / 2;
    const centerY = video.videoHeight / 2;
    const faceX = box.x + box.width / 2;
    const faceY = box.y + box.height / 2;

    const offsetX = Math.abs(centerX - faceX);
    const offsetY = Math.abs(centerY - faceY);
    const toleranceX = video.videoWidth * 0.3;
    const toleranceY = video.videoHeight * 0.3;

    if (offsetX > toleranceX || offsetY > toleranceY) {
      setFeedback("Center your face in the box");
      setIsFrameValid(false);
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(detect);
      }, DETECTION_INTERVAL);
      return;
    }

    // Pass quality checks
    setIsFrameValid(true);
    setFeedback("Hold still... capturing");
    capturedRef.current = true;

    await captureMultiple(video);
  };

  useEffect(() => {
    if (!open || loadingModels) return;

    const start = async () => {
      try {
        capturedRef.current = false;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = async () => {
            await videoRef.current?.play();
            detect();
          };
        }
      } catch {
        setError("Unable to access webcam.");
      }
    };

    start();
    return () => stopWebcam();
  }, [open, loadingModels]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Face Registration</DialogTitle>
          <DialogDescription>Position your face naturally in the camera frame.</DialogDescription>
        </DialogHeader>

        {error && <div className="p-3 bg-red-100 text-red-600 rounded">{error}</div>}

        {!error && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full h-72 rounded-xl overflow-hidden bg-black flex items-center justify-center">
              {/* Mirrored video preview for user comfort */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Visual Oval Framing Target */}
              <div
                className={`absolute w-48 h-60 rounded-[50%] border-4 transition-colors duration-300 pointer-events-none ${
                  isFrameValid
                    ? "border-green-500 bg-green-500/10"
                    : "border-yellow-500/70 bg-transparent"
                }`}
              />
            </div>

            {feedback && (
              <div
                className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  isFrameValid ? "text-green-600 bg-green-50" : "text-yellow-700 bg-yellow-50"
                }`}
              >
                {feedback}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end mt-2">
          <Button
            variant="secondary"
            onClick={() => {
              stopWebcam();
              onClose();
            }}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
