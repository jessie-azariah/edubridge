import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "EduShare Uganda — Free Learning Resources, Past Papers & Q&A",
  description:
    "A community hub for Ugandan students and teachers: PLE, UCE, UACE past papers, notes, schemes of work, a Q&A forum, and Mobile Money tips for educators.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <header id="navbar"></header>
        <main id="app">{children}</main>

        <footer className="site-footer">
          <div className="container footer-grid">
            <div>
              <div className="logo">
                📚 EduShare<span>Uganda</span>
              </div>
              <p className="muted">
                A free, community-powered hub for Uganda&apos;s learners and teachers — past
                papers, notes and academic help, aligned to the UNEB &amp; NCDC curriculum.
              </p>
            </div>
            <div>
              <h4>Browse by level</h4>
              <ul id="footer-levels"></ul>
            </div>
            <div>
              <h4>Platform</h4>
              <ul>
                <li>
                  <a href="#/resources">Resource library</a>
                </li>
                <li>
                  <a href="#/forum">Q&amp;A forum</a>
                </li>
                <li>
                  <a href="#/upload">Share a resource</a>
                </li>
                <li>
                  <a href="#/register">Join free</a>
                </li>
              </ul>
            </div>
            <div>
              <h4>Support educators</h4>
              <p className="muted">
                Love a resource? Tip the teacher via MTN or Airtel Mobile Money to keep free
                learning flowing.
              </p>
            </div>
          </div>
          <p className="footer-copy">
            © <span id="year"></span> EduShare Uganda · Built for Ugandan students &amp; teachers.
          </p>
        </footer>

        <div id="toast" className="toast"></div>
        <script src="/app.js" />
      </body>
    </html>
  );
}
