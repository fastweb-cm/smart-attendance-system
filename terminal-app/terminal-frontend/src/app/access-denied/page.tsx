"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Revoked() {
    const router = useRouter()
  return (
    <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-danger tracking-tight">
                Terminal Revoked
            </h2>
            {/* <p className="text-muted mt-2 text-sm">
                Please contact admin
            </p> */}
            <Button type="button" variant="primary" className="mt-4"
            onClick={() => router.push("/activate")}
            >Reactivate</Button>
        </div>
    </div>
  )
}
