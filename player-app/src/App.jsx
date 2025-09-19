import { Link, Routes, Route } from "react-router-dom";
import { appName } from "../../shared/index.js";

function Layout({ children }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <h1>{appName} — DM</h1>
      <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/">Dashboard</Link>
        <Link to="/parties">Parties</Link>
        <Link to="/encounters">Encounters</Link>
      </nav>
      {children}
    </div>
  );
}

function Dashboard() { return <p>Session prep, timeline, and notes.</p>; }
function Parties()   { return <p>Party management & assignments.</p>; }
function Encounters(){ return <p>Encounter builder and trackers.</p>; }

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/parties" element={<Parties />} />
        <Route path="/encounters" element={<Encounters />} />
      </Routes>
    </Layout>
  );
}
