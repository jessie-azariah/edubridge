"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function FavoriteButton({
  resourceId,
  initialFaved = false,
}: {
  resourceId: number;
  initialFaved?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [faved, setFaved] = useState(initialFaved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });
      const data = await res.json();
      if (res.ok) setFaved(data.isFaved);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
        faved
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
      }`}
    >
      <span>{faved ? "♥" : "♡"}</span>
      {faved ? "Saved" : "Save"}
    </button>
  );
}
