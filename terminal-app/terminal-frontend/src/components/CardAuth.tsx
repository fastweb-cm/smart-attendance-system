"use client";

import { User } from "@/types";

export default function CardAuth({ onSuccess }: { onSuccess: (user: User) => void }) {
  return (
    <button onClick={() => onSuccess({ id: 1, group_id: 2 } as User)}>
      Tap Card
    </button>
  );
}
