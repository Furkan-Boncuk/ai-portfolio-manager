import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { initAuth } from "./lib/api";
import Portfolio from "./pages/Portfolio";
import Signals from "./pages/Signals";
import Chat from "./pages/Chat";
import Processing from "./pages/Processing";

const navItems = [
  { path: "/", label: "Portfolio" },
  { path: "/processing", label: "Processing" },
  { path: "/signals", label: "Signals" },
  { path: "/chat", label: "Chat" },
];

function Navbar() {
  const location = useLocation();

  return (
    <nav className="border-b border-gray-800 bg-gray-950 px-6 py-3 flex gap-6">
      <span className="text-lg font-bold text-blue-400 mr-4">Portfolio AI</span>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`text-sm px-3 py-1 rounded transition-colors ${
            location.pathname === item.path
              ? "bg-blue-800 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function App() {
  useEffect(() => {
    initAuth().catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-200">
        <Navbar />
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Portfolio />} />
            <Route path="/processing" element={<Processing />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
