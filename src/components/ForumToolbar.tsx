"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LEVELS, SUBJECTS } from "@/lib/uganda";

export default function ForumToolbar({ initialQ = "" }: { initialQ?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("general");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function search(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    router.push(trimmed ? `/forum?q=${encodeURIComponent(trimmed)}` : "/forum");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (title.trim().length < 6) return setError("Add a clear title (min 6 characters).");
    if (body.trim().length < 10) return setError("Add more detail to your question.");
    if (!subject) return setError("Pick a subject.");

    setBusy(true);
    const res = await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, subject, level }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not post.");
      return;
    }
    const data = await res.json();
    router.push(`/forum/${data.topic.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={search} className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search questions…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-400"
          />
        </form>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {open ? "Cancel" : "Ask a question"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Question title — be specific"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Describe your question with as much detail as possible…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            >
              <option value="">Select subject…</option>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            >
              {LEVELS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
              <option value="general">General / Other</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? "Posting…" : "Post question"}
          </button>
        </form>
      )}
    </div>
  );
}
