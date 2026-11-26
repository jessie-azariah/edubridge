"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LEVELS, SUBJECTS } from "@/lib/uganda";

export default function ResourceFilters({
  params,
}: {
  params: { q?: string; subject?: string; level?: string; sort?: string };
}) {
  const router = useRouter();
  const [q, setQ] = useState(params.q ?? "");
  const [subject, setSubject] = useState(params.subject ?? "");
  const [level, setLevel] = useState(params.level ?? "");
  const [sort, setSort] = useState(params.sort ?? "newest");

  function push(partial: Record<string, string>) {
    const next = { q, subject, level, sort, ...partial };
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.subject) sp.set("subject", next.subject);
    if (next.level) sp.set("level", next.level);
    if (next.sort && next.sort !== "newest") sp.set("sort", next.sort);
    const qs = sp.toString();
    router.push(qs ? `/resources?${qs}` : "/resources");
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && push({})}
        placeholder="Search resources…"
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
      />
      <select
        value={subject}
        onChange={(e) => push({ subject: e.target.value })}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
      >
        <option value="">All subjects</option>
        {SUBJECTS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <select
        value={level}
        onChange={(e) => push({ level: e.target.value })}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
      >
        <option value="">All levels</option>
        {LEVELS.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(e) => push({ sort: e.target.value })}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
      >
        <option value="newest">Newest</option>
        <option value="popular">Most downloaded</option>
        <option value="rating">Top rated</option>
      </select>
    </div>
  );
}
