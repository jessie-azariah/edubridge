import Link from "next/link";
import { LEVELS } from "@/lib/uganda";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white">
              📚
            </span>
            EduShare<span className="text-emerald-600">Uganda</span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            A free, community-powered hub for Uganda&apos;s learners and teachers —
            past papers, notes and academic help, aligned to the UNEB &amp; NCDC curriculum.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-800">Browse by level</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            {LEVELS.map((l) => (
              <li key={l.id}>
                <Link href={`/resources?level=${l.id}`} className="hover:text-emerald-600">
                  {l.label} <span className="text-slate-400">({l.exam})</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-800">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/resources" className="hover:text-emerald-600">Resource library</Link></li>
            <li><Link href="/forum" className="hover:text-emerald-600">Q&amp;A forum</Link></li>
            <li><Link href="/upload" className="hover:text-emerald-600">Share a resource</Link></li>
            <li><Link href="/register" className="hover:text-emerald-600">Join free</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-800">Support educators</h4>
          <p className="mt-3 text-sm text-slate-500">
            Love a resource? Tip the teacher via MTN or Airtel Mobile Money to keep
            free learning flowing.
          </p>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} EduShare Uganda · Built for Ugandan students &amp; teachers.
      </div>
    </footer>
  );
}
