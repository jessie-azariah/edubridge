"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { initials, timeAgo } from "@/lib/format";

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  author: { username: string; fullName: string; role: string } | null;
};

export default function CommentSection({ resourceId }: { resourceId: number }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  async function load() {
    const res = await fetch(`/api/comments?resourceId=${resourceId}`, { cache: "no-store" });
    const data = await res.json();
    setComments(data.comments ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [resourceId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId, content: text }),
    });
    setPosting(false);
    if (res.ok) {
      setText("");
      load();
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        Community feedback ({comments.length})
      </h2>

      {user ? (
        <form onSubmit={submit} className="mb-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Share how this resource helped you, or ask a question…"
            className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-400"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={posting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {posting ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-5 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
          <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
            Sign in
          </Link>{" "}
          to join the discussion.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400">No comments yet. Be the first!</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                {initials(c.author?.fullName ?? "Anon")}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {c.author?.fullName ?? "Anonymous"}
                  </span>
                  {c.author?.role === "educator" && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Educator
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
