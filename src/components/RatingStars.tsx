"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function RatingStars({
  resourceId,
  initialAvg,
  initialCount,
}: {
  resourceId: number;
  initialAvg: number;
  initialCount: number;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);

  async function rate(value: number) {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId, rating: value }),
      });
      const data = await res.json();
      if (res.ok) {
        setAvg(data.avgRating);
        setCount(data.ratingCount);
      }
    } finally {
      setBusy(false);
    }
  }

  const display = hover || Math.round(avg);

  return (
    <div className="flex items-center gap-2">
      <div className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            disabled={busy}
            onMouseEnter={() => setHover(n)}
            onClick={() => rate(n)}
            className="px-0.5 text-2xl leading-none"
            aria-label={`Rate ${n}`}
          >
            <span className={n <= display ? "text-amber-400" : "text-slate-300"}>★</span>
          </button>
        ))}
      </div>
      <span className="text-sm text-slate-500">
        {avg > 0 ? `${avg.toFixed(1)} · ${count} rating${count === 1 ? "" : "s"}` : "Be the first to rate"}
      </span>
    </div>
  );
}
