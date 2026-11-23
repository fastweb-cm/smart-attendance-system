"use client";

import { motion, AnimatePresence } from "framer-motion";

interface FaceVisualGuideProps {
  isSuccess?: boolean;
  isVerifying?: boolean;
}

export default function FaceVisualGuide({
  isSuccess = false,
  isVerifying = false,
}: FaceVisualGuideProps) {
  return (
    <div className="relative w-44 h-44 flex items-center justify-center my-2 mx-auto">
      <AnimatePresence mode="wait">
        <motion.img
          key={isSuccess ? "face-success" : isVerifying ? "face-verifying" : "face-scan"}
          src="/face/face-scan.svg"
          alt="Face Recognition Guide"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: isVerifying ? [1, 1.03, 1] : 1,
          }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={
            isVerifying
              ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" }
              : { duration: 0.2 }
          }
          className={`w-full h-full object-contain drop-shadow-sm transition-all duration-200 ${
            isSuccess ? "ring-4 ring-blue-500/40 rounded-2xl" : ""
          }`}
        />
      </AnimatePresence>
    </div>
  );
}
