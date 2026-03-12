"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import * as faceapi from "face-api.js";
import { toast } from "react-toastify";
import apiClient from "@/lib/axiosClient";

interface WebcamCaptureModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WebcamCaptureModal({
  open,
  onClose,
}: WebcamCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [faceFeedback, setFaceFeedback] = useState<string | null>(null);
  const [captured, setCaptured] = useState(false);

  /*
  ==============================
  Load face-api models
  ==============================
  */

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingModels(true);

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        ]);

        setLoadingModels(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load face detection models.");
      }
    };

    loadModels();
  }, []);

  /*
  ==============================
  Stop Webcam + Cleanup
  ==============================
  */

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (canvasRef.current) {
      canvasRef.current.remove();
      canvasRef.current = null;
    }
  };

  /*
  ==============================
  Face Detection Loop
  ==============================
  */

  const startDetection = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    let canvas = canvasRef.current;

    if (!canvas) {
      canvas = faceapi.createCanvasFromMedia(video);
      canvas.classList.add("absolute", "top-0", "left-0");
      video.parentElement?.appendChild(canvas);
      canvasRef.current = canvas;
    }

    const displaySize = {
      width: video.clientWidth,
      height: video.clientHeight,
    };

    faceapi.matchDimensions(canvas, displaySize);

    const detect = async () => {
      if (!video || captured) return;

      const detection = await faceapi
        .detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5,
          })
        )
        .withFaceLandmarks();

      const ctx = canvas!.getContext("2d");
      ctx?.clearRect(0, 0, canvas!.width, canvas!.height);

      if (!detection) {
        setFaceFeedback(
          "No face detected. Please position your face in front of the camera."
        );
      } else {
        const resizedDetection = faceapi.resizeResults(detection, displaySize);

        faceapi.draw.drawDetections(canvas!, [resizedDetection]);

        const box = detection.detection.box;

        const videoCenterX = video.videoWidth / 2;
        const videoCenterY = video.videoHeight / 2;

        const faceCenterX = box.x + box.width / 2;
        const faceCenterY = box.y + box.height / 2;

        const offsetX = Math.abs(videoCenterX - faceCenterX);
        const offsetY = Math.abs(videoCenterY - faceCenterY);

        const threshold = video.videoWidth * 0.15;

        if (offsetX > threshold || offsetY > threshold) {
          setFaceFeedback("Please center your face in the frame.");
        } else {
          setFaceFeedback(null);

          if (!captured) {
            setCaptured(true);

            const captureCanvas = document.createElement("canvas");
            captureCanvas.width = video.videoWidth;
            captureCanvas.height = video.videoHeight;

            const ctx = captureCanvas.getContext("2d");
            ctx?.drawImage(video, 0, 0);

            captureCanvas.toBlob(async (blob) => {

              if (!blob) return

              const formData = new FormData();
              formData.append("user_id", String(1))
              formData.append("image",blob, "face.jpg")

              try {
                await apiClient.post('enroll-face',formData)
                toast.success("Face enrolled successfully")
              } catch (error) {
                toast.error(
                  error instanceof Error
                  ? error.message
                  : "An unexpected error occured"
                )
              }finally{
                stopWebcam();
                onClose();
              }
            })
          }
        }
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, [captured, onClose]);

  /*
  ==============================
  Start Webcam
  ==============================
  */

  useEffect(() => {
    if (!open || loadingModels) return;

    const startWebcam = async () => {
      try {
        setError(null);
        setCaptured(false);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = () => {
            startDetection();
          };
        }
      } catch (err) {
        console.error(err);
        setError("Unable to access webcam. Please allow permission.");
      }
    };

    startWebcam();

    return () => {
      stopWebcam();
    };
  }, [open, loadingModels, startDetection]);

  /*
  ==============================
  UI
  ==============================
  */

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle>Record Attendance</DialogTitle>
          <DialogDescription>
            Position your face inside the frame.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        {!error && (
          <div className="mt-6 flex flex-col items-center gap-4 relative">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-md h-64 object-cover rounded-xl bg-black shadow-md"
              />

              <span className="absolute top-3 right-3 px-3 py-1 text-xs bg-green-500 text-white rounded-full shadow">
                ● Live
              </span>

              {/* Face guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-52 border-2 border-white rounded-full opacity-40"></div>
              </div>
            </div>

            {faceFeedback && (
              <div className="mt-2 text-sm text-yellow-600">{faceFeedback}</div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
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
