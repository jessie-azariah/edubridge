"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getLevel, getSubject } from "@/lib/uganda";
import { formatBytes } from "@/lib/format";

export type ResourceCardData = {
  id: number;
  title: string;
  description: string;
  subject: string;
  level: string;
  fileSize: number;
  downloads: number;
  avgRating: number;
  ratingCount: number;
  fileName: string;
  uploader?: { username: string; fullName: string; role: string } | null;
};

export default function ResourceCard({
  resource,
  initialFaved = false,
}: {
  resource: ResourceCardData;
  initialFaved?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [faved, setFaved] = useState(initialFaved);
  const [busy, setBusy] = useState(false);

  const subject = getSubject(resource.subject);
  const level = getLevel(resource.level);

  async function toggleFav() {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: resource.id }),
      });
      const data = await res.json();
      if (res.ok) setFaved(data.isFaved);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-xl">
          {subject?.icon ?? "📁"}
        </span>
        {level && (
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: level.color }}
          >
            {level.short}
          </span>
        )}
      </div>

      <Link href={`/resources/${resource.id}`} className="mt-3 block">
        <h3 className="line-clamp-2 font-semibold text-slate-800 hover:text-emerald-700">
          {resource.title}
        </h3>
      </Link>
      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{resource.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className="font-medium text-slate-600">{subject?.label ?? resource.subject}</span>
        <span>·</span>
        <span>{formatBytes(resource.fileSize)}</span>
        <span>·</span>
        <span>⬇ {resource.downloads.toLocaleString()}</span>
        {resource.ratingCount > 0 && (
          <>
            <span>·</span>
            <span className="text-amber-500">★ {resource.avgRating.toFixed(1)}</span>
            <span>({resource.ratingCount})</span>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <a
          href={`/api/download/${resource.id}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          ⬇ Download
        </a>
        <button
          onClick={toggleFav}
          disabled={busy}
          aria-label="Save"
          className={`grid h-10 w-10 place-items-center rounded-xl border transition ${
            faved
              ? "border-emerald-300 bg-emerald-50 text-emerald-600"
              : "border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600"
          }`}
        >
          {faved ? "♥" : "♡"}
        </button>
      </div>
    </div>
  );
}
