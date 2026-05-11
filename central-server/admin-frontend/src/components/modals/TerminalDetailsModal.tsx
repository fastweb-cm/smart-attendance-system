"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TerminalDetailsView } from "@/components/TerminalDetailsView";
import { TerminalFetchResponse } from "@/client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terminal: TerminalFetchResponse | null;
};

export const TerminalDetailsModal = ({ open, onOpenChange, terminal }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold">Terminal Overview</DialogTitle>
        </DialogHeader>

        {terminal && <TerminalDetailsView terminal={terminal} />}
      </DialogContent>
    </Dialog>
  );
};
