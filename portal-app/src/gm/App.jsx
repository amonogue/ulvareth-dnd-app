import { Link, Routes, Route, Navigate } from "react-router-dom";
import Admin from "./pages/Admin.jsx";
import Inbox from "./pages/Inbox.jsx";
import Import from "./pages/Import.jsx";

export default function App() {
  return (
    <div>
      <div className="nav">
        <div className="nav-inner container">
          <Link to="/admin" className="nav-title">Ulvareth GM</Link>
          <Link to="/admin">Admin</Link>
          <Link to="/inbox">Inbox</Link>
        </div>
      </div>

      <main className="container stack" style={{paddingTop:16}}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/import" element={<Import />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
