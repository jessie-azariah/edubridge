"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({
  defaultValue = "",
  size = "lg",
  placeholder = "Search past papers, notes, subjects…",
}: {
  defaultValue?: string;
  size?: "lg" | "sm";
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/resources?q=${encodeURIComponent(q)}` : "/resources");
  }

  const pad = size === "lg" ? "py-4 pl-14 pr-4 text-base" : "py-2.5 pl-11 pr-3 text-sm";

  return (
    <form onSubmit={submit} className="w-full">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-2xl border border-slate-200 bg-white ${pad} pr-28 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100`}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Search
        </button>
      </div>
    </form>
  );
}
