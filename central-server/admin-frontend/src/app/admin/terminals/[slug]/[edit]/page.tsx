"use client";

import { TerminalWizard } from '@/components/terminalWizard'
import { useTerminalDetailsBySlug } from '@/hooks/useTerminals';
import { useParams } from "next/navigation";

export default function Page() {
  const param = useParams(); // Get slug from URL to determine if we're in edit mode
    const slug = param.slug as string; // Extract slug from params

  const { data: initialData, isLoading } = useTerminalDetailsBySlug(slug);

  if (isLoading) return <div className="text-center">Loading terminal details...</div>;



  return (
    <div className="space-y-4 my-4">
        <TerminalWizard initialData={initialData}/>
    </div>
  )
}
