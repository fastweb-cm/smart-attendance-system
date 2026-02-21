'use client'

import { useState, useEffect } from "react"

export default function ClockDisplay() {
    const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="flex flex-col items-center">
        {/* <div className="text-2xl font-bold">{time.toLocaleTimeString()}</div> */}
        <div className="text-sm text-gray-500">{time.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}</div>
    </div>
  )
}
