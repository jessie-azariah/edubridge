"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { NETWORKS } from "@/lib/uganda";
import { formatUGX } from "@/lib/format";

export default function TipWidget({
  educator,
}: {
  educator: { id: number; fullName: string; username: string };
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState(5000);
  const [network, setNetwork] = useState("mtn");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [total, setTotal] = useState<number | null>(null);

  const presets = [2000, 5000, 10000, 20000];

  async function send() {
    if (!user) {
      router.push("/login");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: educator.id,
          amount,
          network,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send tip");
        setStatus("error");
        return;
      }
      setTotal(data.totalTipped);
      setStatus("done");
      setMessage("");
    } catch {
      setError("Network error");
      setStatus("error");
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <h3 className="flex items-center gap-2 font-semibold text-emerald-800">
        <span>☕</span> Tip {educator.fullName.split(" ")[0]}
      </h3>
      <p className="mt-1 text-sm text-emerald-700/80">
        Support this educator with Mobile Money. Every shilling keeps free learning alive.
      </p>

      {status === "done" ? (
        <div className="mt-4 rounded-xl bg-white p-4 text-center">
          <div className="text-2xl">🎉</div>
          <p className="mt-1 text-sm font-medium text-slate-700">
            Thank you for tipping {formatUGX(amount)}!
          </p>
          {total !== null && (
            <p className="mt-1 text-xs text-slate-500">
              {educator.fullName} has received {formatUGX(total)} in total tips.
            </p>
          )}
          <button
            onClick={() => setStatus("idle")}
            className="mt-3 text-sm font-semibold text-emerald-600 hover:underline"
          >
            Send another
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                  amount === p
                    ? "border-emerald-500 bg-emerald-600 text-white"
                    : "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-400"
                }`}
              >
                {formatUGX(p)}
              </button>
            ))}
          </div>

          <input
            type="number"
            min={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
            placeholder="Custom amount (UGX)"
          />

          <div className="grid grid-cols-2 gap-2">
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                onClick={() => setNetwork(n.id)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  network === n.id
                    ? "border-emerald-500 bg-white text-slate-800"
                    : "border-emerald-200 bg-white/60 text-slate-500"
                }`}
                style={network === n.id ? { borderColor: n.color } : undefined}
              >
                {n.label}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Say something nice (optional)…"
            className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            onClick={send}
            disabled={status === "sending"}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {status === "sending" ? "Processing…" : `Send ${formatUGX(amount)} tip`}
          </button>
          <p className="text-center text-[11px] text-emerald-700/70">
            Demo flow — no real Mobile Money charge is made.
          </p>
        </div>
      )}
    </div>
  );
}
