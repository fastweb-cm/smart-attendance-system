"use client";

import TerminalsTable from "@/app/admin/terminals/terminals-table";
import { TerminalFetchResponse } from "@/client";
import { useTerminals } from "@/hooks/userTerminals";
import { useState } from "react";
import { TerminalDetailsModal } from "./modals/TerminalDetailsModal";

export default function TerminalList() {
  const { data = [], isLoading } = useTerminals();

  const [selected, setSelected] =
    useState<TerminalFetchResponse | null>(null);

  const [open, setOpen] = useState(false);

  if (isLoading) return <div className="text-center">loading...</div>;

  const handleView = (terminal: TerminalFetchResponse) => {
    setSelected(terminal);
    setOpen(true);
  };

  return (
    <>
      <TerminalsTable data={data} onView={handleView} />

      <TerminalDetailsModal
        open={open}
        onOpenChange={setOpen}
        terminal={selected}
      />
    </>
  );
}
