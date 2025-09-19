// player-app/src/App.jsx
import { Link, Routes, Route } from "react-router-dom";
import Quiz from "./pages/Quiz.jsx"; // make sure this file exists

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-steel/20 bg-white/70 dark:bg-night/60">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <h1 className="text-3xl font-bold text-iron">Player Ulvareth</h1>
          <nav className="mt-2 flex flex-wrap items-center gap-4">
            <Link className="hover:underline" to="/">Home</Link>
            <Link className="hover:underline" to="/roster">Roster</Link>
            <Link className="hover:underline" to="/quests">Quests</Link>
            <Link className="hover:underline text-aether" to="/quiz">Quiz</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6">
        <div className="rounded-xl2 bg-white/70 dark:bg-night/60 shadow p-5">
          {children}
        </div>
      </main>
    </div>
  );
}

function Home() {
  return (
    <div className="space-y-2">
      <p>Welcome to the Player portal. Choose a tab above.</p>
      <p className="text-steel">Tip: your DM may share links directly to pages like <code className="px-1 rounded bg-iron/10">#/quiz</code>.</p>
    </div>
  );
}

function Roster() {
  return <p>Roster page (characters, companions, inventory, etc.).</p>;
}

function Quests() {
  return <p>Quests & rumors live here.</p>;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/roster" element={<Roster />} />
        <Route path="/quests" element={<Quests />} />
        <Route path="/quiz" element={<Quiz />} />
      </Routes>
    </Layout>
  );
}

