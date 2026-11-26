import Link from "next/link";
import { LEVELS, SUBJECTS } from "@/lib/uganda";

export default function CategoryGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {LEVELS.map((level) => (
        <Link
          key={level.id}
          href={`/resources?level=${level.id}`}
          className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
        >
          <div
            className="mb-3 grid h-11 w-11 place-items-center rounded-xl text-white"
            style={{ backgroundColor: level.color }}
          >
            <span className="text-lg font-bold">{level.short.slice(0, 2).toUpperCase()}</span>
          </div>
          <h3 className="font-semibold text-slate-800">{level.label}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {level.exam !== "—" ? `Exam: ${level.exam}` : "Foundational learning"}
          </p>
          <span className="mt-3 inline-block text-sm font-medium text-emerald-600 group-hover:underline">
            Browse resources →
          </span>
        </Link>
      ))}

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 sm:col-span-2 lg:col-span-3">
        <h3 className="font-semibold text-slate-800">Popular subjects</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUBJECTS.filter((s) => s.id !== "other").map((s) => (
            <Link
              key={s.id}
              href={`/resources?subject=${s.id}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <span className="mr-1">{s.icon}</span>
              {s.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
