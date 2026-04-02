"use client";

export default function CardAuth({ onSuccess }: { onSuccess: (userId: number) => void }) {
  return (
    <button onClick={() => onSuccess(1)}>
      Tap Card
    </button>
  );
}
