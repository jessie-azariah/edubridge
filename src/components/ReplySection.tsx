"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { initials, timeAgo } from "@/lib/format";

export type Reply = {
  id: number;
  content: string;
  isAccepted: boolean;
  createdAt: string;
  author: { username: string; fullName: string; role: string } | null;
};

export default function ReplySection({
  topicId,
  initialReplies,
  isOwner,
}: {
  topicId: number;
  initialReplies: Reply[];
  isOwner: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [replies, setReplies] = useState(initialReplies);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/forum/${topicId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setReplies((prev) => [...prev, data.reply]);
      setText("");
      router.refresh();
    }
  }

  async function accept(replyId: number) {
    const res = await fetch(`/api/forum/${topicId}/replies/${replyId}/accept`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      setReplies((prev) =>
        prev.map((r) => ({ ...r, isAccepted: r.id === replyId ? data.isAccepted : false })),
      );
      router.refresh();
    }
  }

  const acceptedCount = replies.filter((r) => r.isAccepted).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
        {acceptedCount > 0 && (
          <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            ✓ Answered
          </span>
        )}
      </h2>

      {user ? (
        <form onSubmit={post} className="mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Write your answer…"
            className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-400"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? "Posting…" : "Post reply"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-6 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
          <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
            Sign in
          </Link>{" "}
          to reply.
        </p>
      )}

      {replies.length === 0 ? (
        <p className="text-sm text-slate-400">No replies yet — be the first to help!</p>
      ) : (
        <ul className="space-y-4">
          {replies.map((r) => (
            <li
              key={r.id}
              className={`flex gap-3 rounded-xl border p-4 ${
                r.isAccepted ? "border-emerald-300 bg-emerald-50" : "border-slate-100"
              }`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                {initials(r.author?.fullName ?? "Anon")}
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {r.author?.fullName ?? "Anonymous"}
                  </span>
                  {r.author?.role === "educator" && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Educator
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
                  {r.isAccepted && (
                    <span className="ml-auto rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                      ✓ Accepted answer
                    </span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{r.content}</p>
                {isOwner && !r.isAccepted && (
                  <button
                    onClick={() => accept(r.id)}
                    className="mt-2 text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    Accept as answer
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
