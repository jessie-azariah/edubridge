/* EduShare Uganda — vanilla JS single-page app (hash routing) */
(function () {
  "use strict";

  /* ---------------- Config (mirrors Uganda curriculum) ---------------- */
  const LEVELS = [
    { id: "pre-primary", label: "Pre-Primary (Nursery)", short: "Nursery", exam: "—", color: "#f59e0b" },
    { id: "primary", label: "Primary", short: "Primary", exam: "PLE", color: "#16a34a" },
    { id: "o-level", label: "Lower Secondary (O-Level)", short: "O-Level", exam: "UCE", color: "#0ea5e9" },
    { id: "a-level", label: "Upper Secondary (A-Level)", short: "A-Level", exam: "UACE", color: "#8b5cf6" },
    { id: "btvet", label: "BTVET / Vocational", short: "BTVET", exam: "UBTEB/DIT", color: "#ef4444" },
    { id: "university", label: "Tertiary / University", short: "University", exam: "—", color: "#0d9488" },
  ];
  const SUBJECTS = [
    { id: "mathematics", label: "Mathematics", icon: "📐" },
    { id: "english", label: "English Language", icon: "🔤" },
    { id: "physics", label: "Physics", icon: "⚛️" },
    { id: "chemistry", label: "Chemistry", icon: "🧪" },
    { id: "biology", label: "Biology", icon: "🌱" },
    { id: "computer-studies", label: "Computer Studies / ICT", icon: "💻" },
    { id: "social-studies", label: "Social Studies", icon: "🗺️" },
    { id: "history", label: "History & Political Education", icon: "🏛️" },
    { id: "geography", label: "Geography", icon: "🌍" },
    { id: "economics", label: "Economics", icon: "📊" },
    { id: "entrepreneurship", label: "Entrepreneurship", icon: "💡" },
    { id: "literature", label: "Literature in English", icon: "📚" },
    { id: "religious-education", label: "Religious Education (CRE/IRE)", icon: "🕌" },
    { id: "luganda", label: "Luganda", icon: "🗣️" },
    { id: "runyankole", label: "Runyankole", icon: "🗣️" },
    { id: "luo", label: "Luo", icon: "🗣️" },
    { id: "general-paper", label: "General Paper", icon: "📰" },
    { id: "accounting", label: "Accounting / Commerce", icon: "🧮" },
    { id: "agriculture", label: "Agriculture", icon: "🌾" },
    { id: "technical-drawing", label: "Technical Drawing", icon: "✏️" },
    { id: "other", label: "Other", icon: "📁" },
  ];
  const subj = (id) => SUBJECTS.find((s) => s.id === id) || { label: id, icon: "📁" };
  const lvl = (id) => LEVELS.find((l) => l.id === id) || null;

  /* ---------------- Helpers ---------------- */
  const state = { user: null };
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const initials = (name) =>
    String(name || "?").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const fmtBytes = (b) => {
    if (!b || b <= 0) return "—";
    const u = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), u.length - 1);
    const v = b / Math.pow(1024, i);
    return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${u[i]}`;
  };
  const fmtUGX = (n) => "UGX " + new Intl.NumberFormat("en-UG").format(n || 0);
  function timeAgo(d) {
    const date = new Date(d);
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    const steps = [[60, "second"], [60, "minute"], [24, "hour"], [30, "day"], [12, "month"], [Infinity, "year"]];
    let val = s, unit = "second";
    for (const [step, name] of steps) {
      if (val < step) { unit = name; break; }
      val = Math.floor(val / step); unit = name;
    }
    if (unit === "second" && val < 10) return "just now";
    return `${val} ${unit}${val !== 1 ? "s" : ""} ago`;
  }

  const api = {
    async get(url) {
      const r = await fetch(url, { cache: "no-store" });
      return r.json();
    },
    async post(url, body, isForm) {
      const opt = { method: "POST" };
      if (isForm) opt.body = body;
      else { opt.headers = { "Content-Type": "application/json" }; opt.body = JSON.stringify(body); }
      const r = await fetch(url, opt);
      let data = {};
      try { data = await r.json(); } catch (e) {}
      return { ok: r.ok, data };
    },
  };

  let toastTimer;
  function flash(msg, type) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "toast show" + (type ? " " + type : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = "toast"; }, 3000);
  }

  /* ---------------- Router ---------------- */
  function parseHash() {
    let h = location.hash.replace(/^#/, "");
    if (!h) h = "/";
    const [path, qs] = h.split("?");
    const params = {};
    if (qs) qs.split("&").forEach((p) => { const [k, v] = p.split("="); params[decodeURIComponent(k)] = decodeURIComponent(v || ""); });
    return { path: path || "/", params };
  }

  async function render() {
    renderNav();
    const { path, params } = parseHash();
    const seg = path.split("/").filter(Boolean);
    const app = document.getElementById("app");
    app.innerHTML = `<div class="loading">Loading…</div>`;
    let html = "";
    try {
      if (seg.length === 0) html = await viewHome();
      else if (seg[0] === "resources" && seg.length === 1) html = await viewResources(params);
      else if (seg[0] === "resource" && seg[1]) html = await viewResourceDetail(seg[1]);
      else if (seg[0] === "forum" && seg.length === 1) html = await viewForum(params);
      else if (seg[0] === "topic" && seg[1]) html = await viewTopic(seg[1]);
      else if (seg[0] === "upload") html = viewUpload();
      else if (seg[0] === "login") html = viewLogin();
      else if (seg[0] === "register") html = viewRegister();
      else if (seg[0] === "u" && seg[1]) html = await viewProfile(seg[1]);
      else html = await viewHome();
    } catch (e) {
      html = `<div class="empty">Something went wrong loading this page.</div>`;
    }
    app.innerHTML = html;
    bindView(seg);
    window.scrollTo(0, 0);
  }

  /* ---------------- Nav + footer ---------------- */
  function renderNav() {
    const u = state.user;
    document.getElementById("navbar").innerHTML = `
      <div class="nav-inner">
        <a href="#/" class="logo">📚 EduShare<span>Uganda</span></a>
        <nav class="nav-links">
          <a href="#/resources">Resources</a>
          <a href="#/forum">Q&amp;A Forum</a>
          <a href="#/upload">Share a Resource</a>
        </nav>
        <div class="nav-auth">
          ${u
            ? `<span class="avatar">${initials(u.fullName)}</span><button class="link-btn" data-action="logout">Sign out</button>`
            : `<a href="#/login" class="link-btn">Sign in</a><a href="#/register" class="btn btn-primary btn-sm">Get started</a>`}
        </div>
      </div>`;
    const fl = document.getElementById("footer-levels");
    if (fl) fl.innerHTML = LEVELS.map((l) => `<li><a href="#/resources?level=${l.id}">${l.label} (${l.exam})</a></li>`).join("");
    const yr = document.getElementById("year");
    if (yr) yr.textContent = new Date().getFullYear();
  }

  /* ---------------- Option builders ---------------- */
  function subjectOptions(sel) {
    return `<option value="">All subjects</option>` + SUBJECTS.map((s) => `<option value="${s.id}" ${s.id === sel ? "selected" : ""}>${s.label}</option>`).join("");
  }
  function levelOptions(sel) {
    return `<option value="">All levels</option>` + LEVELS.map((l) => `<option value="${l.id}" ${l.id === sel ? "selected" : ""}>${l.label}</option>`).join("");
  }

  /* ---------------- Shared pieces ---------------- */
  function cardHTML(r) {
    const s = subj(r.subject);
    const l = lvl(r.level);
    const rating = r.ratingCount > 0 ? `<span>·</span><span class="star">★ ${r.avgRating.toFixed(1)} (${r.ratingCount})</span>` : "";
    return `
    <div class="card">
      <div class="card-top">
        <span class="subj-icon">${s.icon}</span>
        ${l ? `<span class="badge" style="background:${l.color}">${l.short}</span>` : ""}
      </div>
      <a href="#/resource/${r.id}" class="card-title">${esc(r.title)}</a>
      <p class="card-desc clamp">${esc(r.description)}</p>
      <div class="card-meta">
        <span>${s.label}</span><span>·</span><span>${fmtBytes(r.fileSize)}</span><span>·</span><span>⬇ ${r.downloads.toLocaleString()}</span>${rating}
      </div>
      <div class="card-actions">
        <a href="/api/download/${r.id}" class="btn btn-primary">⬇ Download</a>
        <button class="btn btn-ghost" data-action="fav" data-id="${r.id}">♡</button>
      </div>
    </div>`;
  }

  /* ---------------- Views ---------------- */
  async function viewHome() {
    const [pop, forumRes, allRes] = await Promise.all([
      api.get("/api/resources?sort=popular"),
      api.get("/api/forum"),
      api.get("/api/resources"),
    ]);
    const trending = (pop.resources || []).slice(0, 6);
    const all = allRes.resources || [];
    const topics = forumRes.topics || [];
    const totalDownloads = all.reduce((a, r) => a + r.downloads, 0);
    const educators = new Set(all.map((r) => r.uploader && r.uploader.username).filter(Boolean)).size;

    const stats = [
      { n: all.length, l: "Resources shared" },
      { n: totalDownloads.toLocaleString(), l: "Total downloads" },
      { n: educators, l: "Educators" },
      { n: topics.length, l: "Forum questions" },
    ];

    return `
    <section class="hero">
      <div class="hero-inner">
        <span class="pill">Free &amp; aligned to the UNEB / NCDC curriculum</span>
        <h1>Learn together. Pass together.</h1>
        <p>Past papers, notes, schemes of work and academic help for every Ugandan learner — from Nursery to University.</p>
        <form data-form="search" class="search-box">
          <input name="q" placeholder="Search past papers, notes, subjects…" />
          <button type="submit">Search</button>
        </form>
        <div class="quick-tags">
          ${["PLE Mathematics", "UCE Physics", "UACE General Paper", "Luganda"].map((t) => `<a href="#/resources?q=${encodeURIComponent(t)}">${t}</a>`).join("")}
        </div>
      </div>
    </section>
    <div class="stats">
      ${stats.map((s) => `<div class="stat"><b>${s.n}</b><span>${s.l}</span></div>`).join("")}
    </div>
    <section class="section">
      <div class="row-between">
        <div><h2>Browse by education level</h2><p class="sub">Everything mapped to Uganda's curriculum — PLE, UCE, UACE, BTVET &amp; beyond.</p></div>
      </div>
      <div class="cat-grid">
        ${LEVELS.map((l) => `
          <a class="cat-card" href="#/resources?level=${l.id}">
            <div class="cat-icon" style="background:${l.color}">${l.short.slice(0, 2).toUpperCase()}</div>
            <h3>${l.label}</h3>
            <p>${l.exam !== "—" ? "Exam: " + l.exam : "Foundational learning"}</p>
            <span class="more">Browse resources →</span>
          </a>`).join("")}
        <div class="subjects-box">
          <h3 style="margin:0 0 4px">Popular subjects</h3>
          <div class="chips">
            ${SUBJECTS.filter((s) => s.id !== "other").map((s) => `<a class="chip" href="#/resources?subject=${s.id}">${s.icon} ${s.label}</a>`).join("")}
          </div>
        </div>
      </div>
    </section>
    <section class="section" style="padding-top:0">
      <div class="row-between">
        <div><h2>Trending resources</h2><p class="sub">Most downloaded by students this week.</p></div>
        <a href="#/resources" style="color:var(--emerald);font-weight:600">View all →</a>
      </div>
      <div class="grid">${trending.map(cardHTML).join("")}</div>
    </section>
    <section class="section" style="padding-top:0">
      <div class="panel" style="background:#0f172a;color:#fff;text-align:center">
        <h2 style="color:#fff">Are you a teacher or creator?</h2>
        <p style="color:#cbd5e1">Share your notes, past papers and schemes of work. Build a following and receive Mobile Money tips from grateful students.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:16px">
          <a href="#/upload" class="btn btn-primary">Share a resource</a>
          <a href="#/register" class="btn btn-ghost" style="color:#fff;border-color:#334155">Create an account</a>
        </div>
      </div>
    </section>`;
  }

  async function viewResources(params) {
    const sp = new URLSearchParams();
    ["q", "subject", "level", "sort"].forEach((k) => { if (params[k]) sp.set(k, params[k]); });
    const data = await api.get("/api/resources?" + sp.toString());
    const list = data.resources || [];
    const heading = params.q ? `Resources matching “${esc(params.q)}”` : "All resources";
    return `
    <div class="container">
      <h1>${heading}</h1>
      <p class="muted">${list.length} free resource${list.length === 1 ? "" : "s"} available to download.</p>
      <form id="res-filters" class="filters">
        <input name="q" value="${esc(params.q || "")}" placeholder="Search resources…" />
        <select name="subject">${subjectOptions(params.subject)}</select>
        <select name="level">${levelOptions(params.level)}</select>
        <select name="sort">
          <option value="newest" ${params.sort === "newest" || !params.sort ? "selected" : ""}>Newest</option>
          <option value="popular" ${params.sort === "popular" ? "selected" : ""}>Most downloaded</option>
          <option value="rating" ${params.sort === "rating" ? "selected" : ""}>Top rated</option>
        </select>
      </form>
      <div class="grid">
        ${list.length ? list.map(cardHTML).join("") : `<div class="empty">No resources found. Try a different search or <a href="#/upload">share one</a>.</div>`}
      </div>
    </div>`;
  }

  async function viewResourceDetail(id) {
    const data = await api.get("/api/resources/" + id);
    const r = data.resource;
    if (!r) return `<div class="empty">Resource not found.</div>`;
    const s = subj(r.subject);
    const l = lvl(r.level);
    const up = r.uploader;

    const c = await api.get("/api/comments?resourceId=" + id);
    const comments = c.comments || [];
    const rel = await api.get("/api/resources?subject=" + encodeURIComponent(r.subject));
    const related = (rel.resources || []).filter((x) => x.id != r.id).slice(0, 3);

    return `
    <div class="container two-col">
      <div>
        <a href="#/resources" class="muted">← Back to resources</a>
        <div class="tags">
          <span class="badge soft">${s.icon} ${s.label}</span>
          ${l ? `<span class="badge" style="background:${l.color}">${l.label}</span>` : ""}
        </div>
        <h1>${esc(r.title)}</h1>
        <div class="meta-row">⬇ ${r.downloads.toLocaleString()} downloads · ${fmtBytes(r.fileSize)} · 📄 ${esc(r.fileName)} · Shared ${timeAgo(r.createdAt)}</div>
        <div class="panel">
          <h3>Description</h3>
          <p class="desc">${esc(r.description)}</p>
          <div class="card-actions">
            <a href="/api/download/${r.id}" class="btn btn-primary">⬇ Download free</a>
            <button class="btn btn-ghost ${data.isFaved ? "saved" : ""}" data-action="fav" data-id="${r.id}">${data.isFaved ? "♥ Saved" : "♡ Save"}</button>
          </div>
        </div>
        <div class="panel">
          <div class="rating">
            ${[1, 2, 3, 4, 5].map((n) => `<button class="star-btn ${n <= Math.round(r.avgRating) ? "on" : ""}" data-action="rate" data-id="${r.id}" data-value="${n}">★</button>`).join("")}
            <span class="muted">${r.ratingCount > 0 ? `${r.avgRating.toFixed(1)} · ${r.ratingCount} rating${r.ratingCount === 1 ? "" : "s"}` : "Be the first to rate"}</span>
          </div>
        </div>
        <div class="panel" id="comments">
          <h3>Community feedback (${comments.length})</h3>
          ${commentFormHTML(r.id)}
          <div id="comment-list">${comments.map(commentHTML).join("") || '<p class="muted">No comments yet. Be the first!</p>'}</div>
        </div>
      </div>
      <aside>
        ${up ? `<div class="panel">Shared by <a href="#/u/${up.username}" style="font-weight:600">${esc(up.fullName)}</a>${up.role === "educator" ? ' <span class="badge soft">Educator</span>' : ""}${up.school ? `<p class="muted" style="margin:6px 0 0">${esc(up.school)}</p>` : ""}</div>` : ""}
        ${up && up.role === "educator" ? tipWidgetHTML(up) : ""}
        ${related.length ? `<div class="panel"><h3>More in ${s.label}</h3>${related.map((x) => `<a href="#/resource/${x.id}" style="display:block;margin-bottom:8px"><div style="font-weight:600">${esc(x.title)}</div><div class="muted" style="font-size:12px">⬇ ${x.downloads.toLocaleString()}</div></a>`).join("")}</div>` : ""}
      </aside>
    </div>`;
  }

  function commentFormHTML(id) {
    if (!state.user) return `<p class="muted"><a href="#/login" style="color:var(--emerald);font-weight:600">Sign in</a> to comment.</p>`;
    return `<form data-form="comment" style="margin-bottom:12px">
      <input type="hidden" name="resourceId" value="${id}" />
      <textarea name="content" rows="3" placeholder="Share how this resource helped you…"></textarea>
      <button class="btn btn-primary btn-sm">Post comment</button>
    </form>`;
  }
  function commentHTML(c) {
    const a = c.author || { fullName: "Anonymous", role: null };
    return `<div class="comment">
      <span class="avatar sm">${initials(a.fullName)}</span>
      <div class="flex1">
        <div class="comment-head">${esc(a.fullName)} ${a.role === "educator" ? '<span class="badge soft">Educator</span>' : ""} <span class="muted">${timeAgo(c.createdAt)}</span></div>
        <p>${esc(c.content)}</p>
      </div>
    </div>`;
  }
  function tipWidgetHTML(u) {
    const presets = [2000, 5000, 10000, 20000];
    return `<div class="panel tip">
      <h3>☕ Tip ${esc(u.fullName.split(" ")[0])}</h3>
      <p class="muted">Support this educator with Mobile Money. Every shilling keeps free learning alive.</p>
      <form data-form="tip">
        <input type="hidden" name="toUserId" value="${u.id}" />
        <div class="preset-row">${presets.map((p) => `<button type="button" class="preset ${p === 5000 ? "active" : ""}" data-preset="${p}">${fmtUGX(p)}</button>`).join("")}</div>
        <input type="number" name="amount" value="5000" min="500" />
        <select name="network"><option value="mtn">MTN Mobile Money</option><option value="airtel">Airtel Money</option></select>
        <textarea name="message" rows="2" placeholder="Say something nice (optional)…"></textarea>
        <button class="btn btn-primary">Send tip</button>
        <p class="muted tiny">Demo flow — no real Mobile Money charge is made.</p>
      </form>
    </div>`;
  }

  async function viewForum(params) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    const data = await api.get("/api/forum?" + sp.toString());
    const topics = data.topics || [];
    return `
    <div class="container narrow">
      <h1>Academic Q&amp;A Forum</h1>
      <p class="muted">Ask questions, get answers from teachers &amp; peers, and mark the best reply.</p>
      <div class="forum-toolbar">
        <form data-form="forum-search" class="search-inline"><input name="q" value="${esc(params.q || "")}" placeholder="Search questions…" /></form>
        <button class="btn btn-primary btn-sm" data-action="toggle-ask">Ask a question</button>
      </div>
      <form data-form="ask" id="ask-form" class="panel hidden">
        <input name="title" placeholder="Question title — be specific" />
        <textarea name="body" rows="4" placeholder="Describe your question with as much detail as possible…"></textarea>
        <div class="row"><select name="subject">${subjectOptions("")}</select><select name="level">${levelOptions("general")}</select></div>
        <button class="btn btn-primary">Post question</button>
      </form>
      <div class="topic-list">
        ${topics.length ? topics.map(topicCardHTML).join("") : `<div class="empty">No questions yet. Be the first!</div>`}
      </div>
    </div>`;
  }
  function topicCardHTML(t) {
    const s = subj(t.subject);
    const l = lvl(t.level);
    return `<a class="topic-card" href="#/topic/${t.id}">
      <div class="tags">${s ? `<span class="badge soft">${s.icon} ${s.label}</span>` : ""}${l && l.id !== "general" ? `<span class="badge" style="background:${l.color}">${l.short}</span>` : ""}</div>
      <h3>${esc(t.title)}</h3>
      <p class="muted clamp">${esc(t.body)}</p>
      <div class="meta-row">${esc((t.author && t.author.fullName) || "Anonymous")} · ${timeAgo(t.createdAt)} · 💬 ${t.replyCount} replies</div>
    </a>`;
  }

  async function viewTopic(id) {
    const [tData, rData] = await Promise.all([api.get("/api/forum/" + id), api.get("/api/forum/" + id + "/replies")]);
    const t = tData.topic;
    if (!t) return `<div class="empty">Question not found.</div>`;
    const s = subj(t.subject);
    const l = lvl(t.level);
    const replies = rData.replies || [];
    const isOwner = state.user && state.user.id === t.userId;
    window.__owner = isOwner; window.__topicId = id;
    return `
    <div class="container narrow">
      <a href="#/forum" class="muted">← Back to forum</a>
      <div class="tags">${s ? `<span class="badge soft">${s.icon} ${s.label}</span>` : ""}${l && l.id !== "general" ? `<span class="badge" style="background:${l.color}">${l.short}</span>` : ""}</div>
      <h1>${esc(t.title)}</h1>
      <div class="meta-row">Asked by ${esc((t.author && t.author.fullName) || "Anonymous")} · ${timeAgo(t.createdAt)} · 👁 ${t.views} views</div>
      <div class="panel"><p class="desc">${esc(t.body)}</p></div>
      <div class="panel" id="replies">
        <h3>${replies.length} ${replies.length === 1 ? "Reply" : "Replies"}</h3>
        ${replyFormHTML(t.id)}
        <div id="reply-list">${replies.map(replyHTML).join("") || '<p class="muted">No replies yet — be the first to help!</p>'}</div>
      </div>
    </div>`;
  }
  function replyFormHTML(topicId) {
    if (!state.user) return `<p class="muted"><a href="#/login" style="color:var(--emerald);font-weight:600">Sign in</a> to reply.</p>`;
    return `<form data-form="reply" style="margin-bottom:14px">
      <input type="hidden" name="topicId" value="${topicId}" />
      <textarea name="content" rows="3" placeholder="Write your answer…"></textarea>
      <button class="btn btn-primary btn-sm">Post reply</button>
    </form>`;
  }
  function replyHTML(rp) {
    const a = rp.author || { fullName: "Anonymous", role: null };
    const accept = window.__owner && !rp.isAccepted
      ? `<button class="link-btn" data-action="accept" data-topic="${window.__topicId}" data-reply="${rp.id}">Accept as answer</button>` : "";
    return `<div class="comment ${rp.isAccepted ? "accepted" : ""}">
      <span class="avatar sm">${initials(a.fullName)}</span>
      <div class="flex1">
        <div class="comment-head">${esc(a.fullName)} ${a.role === "educator" ? '<span class="badge soft">Educator</span>' : ""} <span class="muted">${timeAgo(rp.createdAt)}</span>${rp.isAccepted ? ' <span class="badge" style="background:#16a34a;color:#fff">✓ Accepted</span>' : ""}</div>
        <p>${esc(rp.content)}</p>
        ${accept}
      </div>
    </div>`;
  }

  function viewUpload() {
    if (!state.user)
      return `<div class="container narrow"><div class="panel"><h2>Sign in required</h2><p class="muted">You need an account to share resources. <a href="#/login" style="color:var(--emerald);font-weight:600">Sign in</a> or <a href="#/register" style="color:var(--emerald);font-weight:600">create one</a>.</p></div></div>`;
    return `<div class="container narrow">
      <h1>Share a resource</h1>
      <p class="muted">Upload past papers, notes or schemes of work for the community. Sharing as <b>${esc(state.user.fullName)}</b>.</p>
      <form data-form="upload" class="panel">
        <div class="dropzone" id="dropzone">
          <input type="file" id="file" name="file" hidden />
          <div class="dz-inner" id="dz-inner">⬆️ Drag &amp; drop your file here<br><small>or click to browse · PDF, DOC, PPT, PNG, JPG, TXT · max 15MB</small></div>
        </div>
        <input name="title" placeholder="Title (e.g. UCE 2022 Mathematics Past Paper)" />
        <textarea name="description" rows="3" placeholder="What does this cover? Who is it for?"></textarea>
        <div class="row"><select name="subject">${subjectOptions("")}</select><select name="level">${levelOptions("")}</select></div>
        <div id="upload-error" class="error"></div>
        <button class="btn btn-primary">Publish resource</button>
        <p class="muted tiny">Uploads are shared publicly to help fellow Ugandan learners.</p>
      </form>
    </div>`;
  }

  async function viewProfile(username) {
    const data = await api.get("/api/users/" + encodeURIComponent(username));
    const u = data.user;
    if (!u) return `<div class="empty">User not found.</div>`;
    const isEdu = u.role === "educator";
    return `
    <div class="container two-col">
      <aside>
        <div class="panel center">
          <span class="avatar lg">${initials(u.fullName)}</span>
          <h2>${esc(u.fullName)}</h2>
          <p class="muted">@${esc(u.username)}</p>
          <span class="badge soft">${isEdu ? "Educator" : "Student"}</span>
          ${u.school ? `<p class="muted" style="margin:8px 0 0">${esc(u.school)}</p>` : ""}
          ${u.bio ? `<p style="margin-top:10px">${esc(u.bio)}</p>` : ""}
          <div class="stat-row">
            <div><b>${data.resources.length}</b><span>Resources</span></div>
            <div><b>${(data.resources.reduce((a, r) => a + r.downloads, 0)).toLocaleString()}</b><span>Downloads</span></div>
            <div><b>${isEdu ? fmtUGX(data.totalTips) : "—"}</b><span>Tipped</span></div>
          </div>
        </div>
        ${isEdu ? tipWidgetHTML(u) : ""}
      </aside>
      <div>
        <h2>Resources by ${esc(u.fullName.split(" ")[0])}</h2>
        <div class="grid">${data.resources.length ? data.resources.map(cardHTML).join("") : '<div class="empty">No resources shared yet.</div>'}</div>
      </div>
    </div>`;
  }

  function viewLogin() {
    return `<div class="container narrow"><div class="panel">
      <h2>Welcome back</h2>
      <form data-form="login">
        <input name="identifier" placeholder="Username or email" />
        <input name="password" type="password" placeholder="Password" />
        <button class="btn btn-primary">Sign in</button>
        <p class="muted">New here? <a href="#/register" style="color:var(--emerald);font-weight:600">Create a free account</a></p>
      </form></div></div>`;
  }
  function viewRegister() {
    return `<div class="container narrow"><div class="panel">
      <h2>Join EduShare Uganda</h2>
      <form data-form="register">
        <input name="fullName" placeholder="Full name" />
        <input name="username" placeholder="Username (min 3 chars)" />
        <input name="email" type="email" placeholder="Email address" />
        <div class="row"><select name="role"><option value="student">I'm a student</option><option value="educator">I'm an educator</option></select><input name="school" placeholder="School (optional)" /></div>
        <input name="password" type="password" placeholder="Password (min 6 chars)" />
        <button class="btn btn-primary">Create account</button>
        <p class="muted">Already have an account? <a href="#/login" style="color:var(--emerald);font-weight:600">Sign in</a></p>
      </form></div></div>`;
  }

  /* ---------------- Per-view binding ---------------- */
  function bindView(seg) {
    if (seg[0] === "resources" && seg.length === 1) bindResources();
    if (seg[0] === "upload") bindUpload();
  }
  function bindResources() {
    const form = document.getElementById("res-filters");
    if (!form) return;
    const update = () => {
      const sp = new URLSearchParams();
      if (form.q.value.trim()) sp.set("q", form.q.value.trim());
      if (form.subject.value) sp.set("subject", form.subject.value);
      if (form.level.value) sp.set("level", form.level.value);
      if (form.sort.value && form.sort.value !== "newest") sp.set("sort", form.sort.value);
      location.hash = "#/resources" + (sp.toString() ? "?" + sp.toString() : "");
    };
    form.addEventListener("change", update);
    form.addEventListener("submit", (e) => { e.preventDefault(); update(); });
  }
  function bindUpload() {
    const dz = document.getElementById("dropzone");
    const file = document.getElementById("file");
    const inner = document.getElementById("dz-inner");
    if (!dz) return;
    dz.addEventListener("click", () => file.click());
    file.addEventListener("change", () => { if (file.files[0]) inner.innerHTML = "📄 " + esc(file.files[0].name) + " <br><small>" + fmtBytes(file.files[0].size) + "</small>"; });
    dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("drag"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("drag"));
    dz.addEventListener("drop", (e) => {
      e.preventDefault(); dz.classList.remove("drag");
      if (e.dataTransfer.files[0]) { file.files = e.dataTransfer.files; inner.innerHTML = "📄 " + esc(file.files[0].name); }
    });
  }

  /* ---------------- Global event handlers ---------------- */
  async function onClick(e) {
    const el = e.target.closest("[data-action]");
    if (el) {
      const a = el.dataset.action;
      if (a === "logout") { await api.post("/api/auth/logout"); state.user = null; flash("Signed out"); render(); return; }
      if (a === "fav") { await toggleFav(el.dataset.id, el); return; }
      if (a === "rate") { await rate(el.dataset.id, el.dataset.value); return; }
      if (a === "accept") { await acceptAnswer(el.dataset.topic, el.dataset.reply); return; }
      if (a === "toggle-ask") { const f = document.getElementById("ask-form"); if (f) f.classList.toggle("hidden"); return; }
    }
    const preset = e.target.closest("[data-preset]");
    if (preset) {
      const v = preset.dataset.preset;
      const form = preset.closest("form");
      if (form) form.amount.value = v;
      document.querySelectorAll(".preset").forEach((p) => p.classList.remove("active"));
      preset.classList.add("active");
    }
  }

  async function onSubmit(e) {
    const form = e.target.closest("[data-form]");
    if (!form) return;
    e.preventDefault();
    switch (form.dataset.form) {
      case "search": { const q = form.q.value.trim(); location.hash = q ? "#/resources?q=" + encodeURIComponent(q) : "#/resources"; break; }
      case "forum-search": { const q = form.q.value.trim(); location.hash = q ? "#/forum?q=" + encodeURIComponent(q) : "#/forum"; break; }
      case "login": return doLogin(form);
      case "register": return doRegister(form);
      case "comment": return doComment(form);
      case "ask": return doAsk(form);
      case "reply": return doReply(form);
      case "tip": return doTip(form);
      case "upload": return doUpload(form);
    }
  }

  async function toggleFav(id, el) {
    if (!state.user) { location.hash = "#/login"; return; }
    const { ok, data } = await api.post("/api/favorites", { resourceId: Number(id) });
    if (ok) { el.textContent = data.isFaved ? "♥" : "♡"; el.classList.toggle("saved", data.isFaved); }
  }
  async function rate(id, value) {
    if (!state.user) { location.hash = "#/login"; return; }
    const { ok } = await api.post("/api/ratings", { resourceId: Number(id), rating: Number(value) });
    if (ok) { flash("Thanks for rating!"); render(); }
  }
  async function acceptAnswer(topicId, replyId) {
    const { ok } = await api.post(`/api/forum/${topicId}/replies/${replyId}/accept`);
    if (ok) render();
  }
  async function doLogin(form) {
    const { ok, data } = await api.post("/api/auth/login", { identifier: form.identifier.value, password: form.password.value });
    if (ok) { state.user = data.user; flash("Welcome back!"); location.hash = "#/"; }
    else flash(data.error || "Login failed", "err");
  }
  async function doRegister(form) {
    const payload = { fullName: form.fullName.value, username: form.username.value, email: form.email.value, password: form.password.value, role: form.role.value, school: form.school.value };
    const { ok, data } = await api.post("/api/auth/register", payload);
    if (ok) { state.user = data.user; flash("Account created!"); location.hash = "#/"; }
    else flash(data.error || "Registration failed", "err");
  }
  async function doComment(form) {
    const { ok } = await api.post("/api/comments", { resourceId: Number(form.resourceId.value), content: form.content.value });
    if (ok) { flash("Comment posted!"); render(); } else flash("Could not post", "err");
  }
  async function doAsk(form) {
    const { ok, data } = await api.post("/api/forum", { title: form.title.value, body: form.body.value, subject: form.subject.value, level: form.level.value });
    if (ok) location.hash = "#/topic/" + data.topic.id;
    else flash(data.error || "Failed", "err");
  }
  async function doReply(form) {
    const { ok } = await api.post(`/api/forum/${form.topicId.value}/replies`, { content: form.content.value });
    if (ok) { flash("Reply posted!"); render(); } else flash("Failed", "err");
  }
  async function doTip(form) {
    const { ok, data } = await api.post("/api/tips", { toUserId: Number(form.toUserId.value), amount: Number(form.amount.value), network: form.network.value, message: form.message.value });
    if (ok) { flash("Thank you for tipping " + fmtUGX(Number(form.amount.value)) + "!"); render(); }
    else flash(data.error || "Failed", "err");
  }
  async function doUpload(form) {
    const file = form.querySelector("#file");
    if (!file.files || !file.files[0]) { document.getElementById("upload-error").textContent = "Attach a file."; return; }
    const fd = new FormData(form);
    const { ok, data } = await api.post("/api/resources", fd, true);
    if (ok) { flash("Resource published!"); location.hash = "#/resource/" + data.resource.id; }
    else document.getElementById("upload-error").textContent = data.error || "Upload failed.";
  }

  /* ---------------- Init ---------------- */
  async function init() {
    try { const { user } = await api.get("/api/auth/me"); state.user = user || null; } catch (e) {}
    try { await api.post("/api/seed"); } catch (e) {}
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    window.addEventListener("hashchange", render);
    render();
  }
  init();
})();
