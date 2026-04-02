// "use client";

// import Annoucements from '@/components/Annoucements'
// import ClockDisplay from '@/components/ClockDisplay'
// import EventsList from '@/components/Events'
// import HeaderBar from '@/components/HeaderBar'
// import { AnnouncementsData, EventsData } from '@/lib/data'
// import StatusModal from '@/components/StatusModal'
// import { useState } from 'react'
// import WebcamCaptureModal from '@/components/WebcamVerify';
// import { AttendanceState } from '@/types';

// export default function TerminalPage() {
//   const [attendanceState, setAttendanceState] = useState<AttendanceState>("idle"); //default the terminal is in idle state
//   const [message, setMessage] = useState("");
//   const [feedback, setFeedback] = useState("Capturing...");

//   return (
//     <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg py-2 px-8">
//         <HeaderBar />
//         <ClockDisplay />
//         {/* <p className="text-primary text-center text-2xl">Swipe Card to Begin</p> */}
//         <div className="flex gap-2 items-center justify-center my-6">
//             <div className="w-1/4 h-18 bg-gray-200 rounded-md animate-pulse text-center py-6 px-2"
//             onClick={() => setAttendanceState("capturing")}
//             >Record Attendance</div>
//             {/* <div className="w-1/4 h-18 bg-warning rounded-md animate-pulse text-center py-6 px-2">Event Attendance</div> */}
//         </div>
//         {attendanceState === "capturing" && <div className="text-center text-yellow-600">{feedback}</div>}
//         <Annoucements announcements={AnnouncementsData} />
//         <EventsList events={EventsData} />

//         {/* Webcam Section */}
//         <div className="my-4 flex justify-center">
//           <WebcamCaptureModal 
//             open={attendanceState === "capturing"} 
//             onClose={() => setAttendanceState("idle")}
//             onCaptureStart={() => setAttendanceState("verifying")}
//             onFeedback={(msg) => setFeedback(msg)}
//             onResult={(status,msg) => {
//               setMessage(msg);
//               setAttendanceState(status);

//               setTimeout(() => {
//                 setAttendanceState("idle")
//               },2000)
//             }}
//           />
//         </div>

//         {/* verifying loader */}
//         <StatusModal
//           isOpen={attendanceState === "verifying"}
//           status="verifying"
//           message="Verifying..."
//         />

//         {/* Result */}
//         <StatusModal
//           isOpen={attendanceState === "success" || attendanceState === "error"}
//           status={attendanceState}
//           message={message}
//         />
//     </div>
//   )
// }

"use client";

import { useState } from "react";
import { buildAuthFlow } from "@/lib/authFlow";
import { useAuthFlow } from "@/hooks/useAuthFlow";
import AuthStepRenderer from "@/components/AuthStepRendere";
import { useTerminalConfig } from "@/context/TerminalConfigContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, SkipForward, Play } from "lucide-react";

export default function TerminalPage() {
  const config = useTerminalConfig();
  const steps = buildAuthFlow(config?.auth_capabilities ?? []);

  const {
    currentStep,
    next,
    skip,
    setUser,
    shouldAllowStep,
    currentStepIndex
  } = useAuthFlow(steps);

  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState("");

  const isLastStep = currentStepIndex === steps.length - 1;

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Ready to Scan</h1>
          <p className="text-slate-500 font-medium">Please tap the button below to begin</p>
        </div>
        <button 
          onClick={() => setStarted(true)}
          className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 rounded-2xl text-2xl font-bold transition-all shadow-xl hover:shadow-blue-200"
        >
          <Play className="fill-current w-6 h-6" />
          START ATTENDANCE
        </button>
      </div>
    );
  }

  // Automatic skip logic if step is not allowed
  if (!shouldAllowStep(currentStep.type)) {
    next();
    return null;
  }

  return (
    <div className="w-2xl mx-auto py-8">
      {/* 1. Step Indicator Bar */}
      <div className="flex items-center justify-center gap-4 mb-1">
        {steps.map((s, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full font-bold border-2 transition-colors
              ${idx === currentStepIndex ? 'bg-blue-600 border-blue-600 text-white' : 
                idx < currentStepIndex ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-300'}
            `}>
              {idx < currentStepIndex ? "✓" : idx + 1}
            </div>
            {idx < steps.length - 1 && <div className="h-1 w-8 bg-slate-100 rounded-full" />}
          </div>
        ))}
      </div>

      {/* 2. Main Action Card */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStep.type}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 text-center"
        >
          <div className="mb-6">
            <span className="inline-block px-4 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase tracking-widest mb-2">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <h2 className="text-3xl font-bold text-slate-900 capitalize italic">
              Verify {currentStep.type}
            </h2>
          </div>

          <div className="min-h-[300px] flex flex-col items-center justify-center bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 overflow-hidden relative">
            <AuthStepRenderer
              step={currentStep}
              onSuccess={(userId: number) => {
                // If we don't have a user yet, set context
                setUser(userId, config?.access_policy ?? []);
                next();
              }}
              onFailure={(msg: string) => setMessage(msg)}
            />
          </div>

          <div className="flex items-center justify-between mt-8">
            <p className={`text-sm font-medium ${message ? 'text-red-500' : 'text-slate-400'}`}>
              {message || "Follow instructions on screen"}
            </p>
            
            {!isLastStep && (
              <button 
                onClick={skip}
                className="flex items-center bg-warning py-1 px-2 rounded-md gap-2 text-black hover:text-slate-600 font-bold text-sm uppercase transition-colors"
              >
                Skip Step <SkipForward className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <button 
        onClick={() => setStarted(false)}
        className="mt-4 mx-auto block text-slate-400 font-medium hover:text-red-500 text-sm transition-colors"
      >
        Cancel & Return to Home
      </button>
    </div>
  );
}
