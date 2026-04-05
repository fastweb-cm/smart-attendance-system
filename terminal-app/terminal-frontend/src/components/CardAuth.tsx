"use client";

import { AuthType, User } from "@/types";

export default function CardAuth({ onSuccess }: { onSuccess: (user: User, attendance_status: string, next_step: AuthType | null, attendance_type: string | null) => void }) {
  return (
    <button onClick={() => onSuccess({ id: 1, group_id: 2, fName: "ichami", lName: "brandon" } as User, "in_progress", null, null)}>
      Tap Card
    </button>
  );
}
