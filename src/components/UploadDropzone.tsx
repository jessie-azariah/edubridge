"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { LEVELS, SUBJECTS } from "@/lib/uganda";
import { formatBytes } from "@/lib/format";

const ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "text/plain",
  "text/markdown",
];
const MAX_BYTES = 15 * 1024 * 1024;

export default function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function pickFile(f: File | null) {
    setError("");
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setError("Unsupported file type. Use PDF, DOC, PPT, PNG, JPG or TXT.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File is larger than 15 MB.");
      return;
    }
    setFile(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!file) return setError("Attach a file to upload.");
    if (title.trim().length < 4) return setError("Give your resource a clear title.");
    if (description.trim().length < 10) return setError("Add a short description.");
    if (!subject || !level) return setError("Pick a subject and education level.");

    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title);
    fd.append("description", description);
    fd.append("subject", subject);
    fd.append("level", level);

    const res = await fetch("/api/resources", { method: "POST", body: fd });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed.");
      return;
    }
    const data = await res.json();
    router.push(`/resources/${data.resource.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pickFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          drag ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50 hover:border-emerald-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center gap-3">
            <span className="text-3xl">📄</span>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
            </div>
          </div>
        ) : (
          <>
            <span className="text-4xl">⬆️</span>
            <p className="mt-2 text-sm font-medium text-slate-700">
              Drag &amp; drop your file here
            </p>
            <p className="text-xs text-slate-500">or click to browse · PDF, DOC, PPT, PNG, JPG, TXT · max 15 MB</p>
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. UCE 2022 Mathematics Past Paper"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What does this resource cover? Who is it for?"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          >
            <option value="">Select subject…</option>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Education level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          >
            <option value="">Select level…</option>
            {LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Publish resource"}
      </button>
      <p className="text-center text-xs text-slate-400">
        Uploads are shared publicly to help fellow Ugandan learners.
      </p>
    </form>
  );
}
