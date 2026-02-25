"use client"
import Image from "next/image"
import { useTerminalConfig } from "@/context/TerminalConfigContext"

export default function HeaderBar() {
  const config = useTerminalConfig();
  return (
    <div className="flex items-center justify-between">
        {/* logo */}
        <div className="flex items-center space-x-2">
            <Image src="/logo.jpg" alt="Logo" width={32} height={32} />
            <span className="text-xl font-bold text-primary">SSEC Bamenda</span>
        </div>
        {/* branchname */}
        {/* <div className="text-sm font-medium text-gray-600">
          Branch: Main Street
        </div> */}
        {/* terminal name */}
        <div className="flex items-start flex-col">
          <div className="text-sm font-medium">
            Terminal: <span className="text-muted">{config?.terminal_code}</span>
          </div>
          <div className="text-sm font-medium">
            Branch: <span className="text-muted">{config?.branch}</span>
          </div>
        </div>
    </div>
  )
}
