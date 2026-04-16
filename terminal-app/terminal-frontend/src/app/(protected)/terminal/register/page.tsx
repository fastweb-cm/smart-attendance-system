// "use client";

// import ClockDisplay from '@/components/ClockDisplay'
// import HeaderBar from '@/components/HeaderBar'
// import WebcamCapture from '@/components/WebcamCapture';
// import StatusModal from '@/components/StatusModal'
// import { useState } from 'react'
// import { AttendanceState } from '@/types';

// export default function TerminalPage() {
//   const [attendanceState, setAttendanceState] = useState<AttendanceState>("idle"); //default the terminal is in idle state
//   const [message, setMessage] = useState("");

//   return (
//     <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg py-2 px-8">
//         <HeaderBar />
//         <ClockDisplay />
//         {/* <p className="text-primary text-center text-2xl">Swipe Card to Begin</p> */}
//         <div className="flex gap-2 items-center justify-center my-6">
//             <div className="w-1/4 h-18 bg-gray-200 rounded-md animate-pulse text-center py-6 px-2"
//             onClick={() => setAttendanceState("capturing")}
//             >Register Face Template</div>
//             {/* <div className="w-1/4 h-18 bg-warning rounded-md animate-pulse text-center py-6 px-2">Event Attendance</div> */}
//         </div>

//         {/* Webcam Section */}
//         <div className="my-4 flex justify-center">
//           <WebcamCapture 
//             open={attendanceState === "capturing"} 
//             onClose={() => setAttendanceState("idle")}
//             onCaptureStart={() => setAttendanceState("verifying")}
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
//           message="Registering..."
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

import React from 'react'

function page() {
  return (
    <div>page</div>
  )
}

export default page
