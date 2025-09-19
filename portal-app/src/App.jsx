import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, NavLink, Link, useLocation } from "react-router-dom";

/** Lazy-load pages to keep the initial bundle small */
const PlayerQuiz = lazy(() => import("./player/pages/Quiz.jsx"));
const GMAdmin    = lazy(() => import("./gm/pages/Admin.jsx"));
const GMInbox    = lazy(() => import("./gm/pages/Inbox.jsx"));
const GMImport   = lazy(() => import("./gm/pages/Import.jsx"));

/** Scroll to top on route change (nice with HashRouter) */
function ScrollToTop() {
  const loc = useLocation();
  useEffect(() => {
    // Defer so it runs after DOM paints
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }, [loc.pathname, loc.hash, loc.search]);
  return null;
}

export default function App() {
  return (
    <div>
      <nav className="nav">
        <div className="nav-inner container">
          <Link to="/" className="nav-title">Ulvareth Portal</Link>

          <NavLink
            to="/quiz"
            className={({ isActive }) =>
              "px-2 py-1 rounded-md font-semibold " +
              (isActive ? "bg-black/10 text-swords" : "hover:bg-black/5")
            }
          >
            Player
          </NavLink>

          <NavLink
            to="/gm/admin"
            className={({ isActive }) =>
              "px-2 py-1 rounded-md font-semibold " +
              (isActive ? "bg-black/10 text-swords" : "hover:bg-black/5")
            }
          >
            GM
          </NavLink>

          <NavLink
            to="/gm/inbox"
            className={({ isActive }) =>
              "px-2 py-1 rounded-md font-semibold " +
              (isActive ? "bg-black/10 text-swords" : "hover:bg-black/5")
            }
          >
            Inbox
          </NavLink>
        </div>
      </nav>

      <main className="container pt-4">
        <ScrollToTop />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Player */}
            <Route path="/quiz" element={<PlayerQuiz />} />

            {/* GM */}
            <Route path="/gm/admin" element={<GMAdmin />} />
            <Route path="/gm/inbox" element={<GMInbox />} />
            <Route path="/gm/import" element={<GMImport />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

/** Home portal landing */
function Home() {
  return (
    <div className="stack">
      <section className="card">
        <h1 className="m-0 text-xl font-bold text-swords">Ulvareth Portal</h1>
        <p className="text-gray-600">Choose your destination:</p>

        <div className="flex flex-wrap gap-2 mt-2">
          <Link className="btn btn-primary" to="/quiz">Player Quiz</Link>
          <Link className="btn btn-ghost" to="/gm/admin">GM Admin</Link>
          <Link className="btn btn-ghost" to="/gm/inbox">GM Inbox</Link>
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer">How do imports work?</summary>
          <p className="text-gray-600 mt-2">
            The Player app can generate a link like <code className="bg-gray-100 px-1 rounded">#/gm/import?data=…</code>.
            Opening that link inside this portal drops the result into your GM Inbox.
          </p>
        </details>
      </section>
    </div>
  );
}

/** Lightweight loading state for lazy routes */
function Loading() {
  return (
    <div className="card">
      <div className="animate-pulse text-gray-600">Loading…</div>
    </div>
  );
}
