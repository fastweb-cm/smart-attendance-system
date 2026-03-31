"use client";

export default function CardAuth({ onSuccess }: { onSuccess: (userId: number) => void }) {
  return (
    <button onClick={() => onSuccess(123)}>
      Tap Card
    </button>
  );
}
