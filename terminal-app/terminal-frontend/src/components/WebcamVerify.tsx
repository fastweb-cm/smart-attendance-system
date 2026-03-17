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
import { toast } from "react-toastify";
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
  const lastDetectionTime = useRef<number>(0);

  const [loadingModels, setLoadingModels] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const DETECTION_INTERVAL = 200; // 5 fps

  /*
   Load face-api models
  */
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

  /*
   Stop webcam
  */
  const stopWebcam = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  /*
   Blur Detection
  */
  const isBlurry = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let sum = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
      sum += imageData.data[i];
    }

    const avg = sum / (imageData.data.length / 4);

    return avg < 50;
  };

  /*
   Lighting Check
  */
  const isTooDark = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let brightness = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      brightness += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    }

    brightness /= pixels.length / 4;

    return brightness < 60;
  };

  /*
   Capture Image
  */
  const capture = async (video: HTMLVideoElement) => {
    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // mirror correction
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(video, 0, 0);

    if (isBlurry(canvas)) {
      setFeedback("Image is blurry. Please hold still.");
      capturedRef.current = false;
      return;
    }

    if (isTooDark(canvas)) {
      setFeedback("Lighting is too dark.");
      capturedRef.current = false;
      return;
    }

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append("user_id", String(1));
        formData.append("image", blob, "face.jpg");

        stopWebcam()
        onClose()
        onCaptureStart()

        try {
          const res = await apiClient.post("verify", formData);
          console.log(res)
          if (res.data.verified){
            onResult(
              "success",
              "Verification successfull."
            );
          }else{
            onResult(
              "error",
              `Verification failed.`
            );
          }
          console.log(res.data)
          capturedRef.current = true;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          onResult(
            "error",
            error.response?.data?.detail || "Verification failed"
          );
          capturedRef.current = false;
        }
      },
      "image/jpeg",
      0.95
    );
  };

  /*
   Detection Loop
  */
  const detect = async () => {
  const video = videoRef.current;

  if (!video || capturedRef.current) return;

  const detection = await faceapi
    .detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 160,
        scoreThreshold: 0.5,
      })
    )
    .withFaceLandmarks();

  if (!detection) {
    setFeedback("No face detected.");

    setTimeout(() => {
      animationRef.current = requestAnimationFrame(detect);
    }, DETECTION_INTERVAL);

    return;
  }

  const box = detection.detection.box;

  const centerX = video.videoWidth / 2;
  const centerY = video.videoHeight / 2;

  const faceX = box.x + box.width / 2;
  const faceY = box.y + box.height / 2;

  const offsetX = Math.abs(centerX - faceX);
  const offsetY = Math.abs(centerY - faceY);

  const threshold = video.videoWidth * 0.15;

  if (offsetX > threshold || offsetY > threshold) {
    setFeedback("Center your face.");

    setTimeout(() => {
      animationRef.current = requestAnimationFrame(detect);
    }, DETECTION_INTERVAL);

    return;
  }

  setFeedback("Hold still... capturing");

  capturedRef.current = true;

  await capture(video);
};

  /*
   Start Webcam
  */
  useEffect(() => {
    if (!open || loadingModels) return;

    const start = async () => {
      try {
        capturedRef.current = false;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
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

  /*
   UI
  */
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Attendance</DialogTitle>
          <DialogDescription>
            Align your face with the camera.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-100 text-red-600 rounded">{error}</div>
        )}

        {!error && (
          <div className="flex flex-col items-center gap-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 rounded-xl bg-black object-cover"
            />

            {feedback && (
              <div className="text-sm text-yellow-600">{feedback}</div>
            )}
          </div>
        )}

        <div className="flex justify-end mt-4">
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
