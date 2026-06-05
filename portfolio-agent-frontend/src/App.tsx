import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { initAuth } from "./lib/api";
import Portfolio from "./pages/Portfolio";
import Signals from "./pages/Signals";
import Chat from "./pages/Chat";
import Processing from "./pages/Processing";
import DecisionsPage from "./pages/Decisions/DecisionsPage";
import PositionsPage from "./pages/Positions/PositionsPage";
import KnowledgePage from "./pages/Knowledge/KnowledgePage";
import { Navbar } from "./components/molecules/Navbar/Navbar";

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
            <Route path="/decisions" element={<DecisionsPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/positions" element={<PositionsPage />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
