"use client";

import { motion, AnimatePresence } from "framer-motion";

interface FingerprintVisualGuideProps {
  stage: number | null; // 1 to 5
  isSuccess?: boolean;
}

export default function FingerprintVisualGuide({ stage, isSuccess }: FingerprintVisualGuideProps) {
  // Map stage number or success state to the exact SVG file path in public/fingerprint/
  const getImagePath = () => {
    if (isSuccess || stage === 5) return "/fingerprint/step5-done.svg";
    switch (stage) {
      case 1: return "/fingerprint/step1-center.svg";
      case 2: return "/fingerprint/step2-left.svg";
      case 3: return "/fingerprint/step3-right.svg";
      case 4: return "/fingerprint/step4-tip.svg";
      default: return "/fingerprint/step1-center.svg"; // Default resting state before scan starts
    }
  };

  return (
    <div className="relative w-44 h-44 flex items-center justify-center my-2 mx-auto">
      <AnimatePresence mode="wait">
        <motion.img
          key={isSuccess ? "success" : stage ?? "default"}
          src={getImagePath()}
          alt={`Fingerprint Scanner Stage ${stage || 1}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full object-contain drop-shadow-sm"
        />
      </AnimatePresence>
    </div>
  );
}
