"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function AuthForm({
  defaultMode = "login",
  next = "/",
}: {
  defaultMode?: "login" | "register";
  next?: string;
}) {
  const { login, register } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [school, setSchool] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    if (mode === "login") {
      const res = await login(username, password);
      setBusy(false);
      if (!res.ok) return setError(res.error ?? "Login failed");
      router.push(next);
      router.refresh();
    } else {
      const res = await register({ fullName, username, email, password, role, school });
      setBusy(false);
      if (!res.ok) return setError(res.error ?? "Registration failed");
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm">
        <button
          onClick={() => setMode("login")}
          className={`rounded-lg py-2 font-medium transition ${
            mode === "login" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
          }`}
        >
          Sign in
        </button>
        <button
          onClick={() => setMode("register")}
          className={`rounded-lg py-2 font-medium transition ${
            mode === "register" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username (min 3 chars)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email address"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              >
                <option value="student">I'm a student</option>
                <option value="educator">I'm an educator</option>
              </select>
              <input
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="School (optional)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              />
            </div>
          </>
        )}
        {mode === "login" && (
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username or email"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          />
        )}
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password (min 6 chars)"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">
        {mode === "login" ? (
          <>New here? <Link href="/register" className="font-semibold text-emerald-600 hover:underline">Create a free account</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="font-semibold text-emerald-600 hover:underline">Sign in</Link></>
        )}
      </p>
    </div>
  );
}
