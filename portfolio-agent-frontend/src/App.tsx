import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { initAuth } from "./lib/api";
import PortfolioPage from "./pages/Portfolio/PortfolioPage";
import SignalsPage from "./pages/Signals/SignalsPage";
import ChatPage from "./pages/Chat/ChatPage";
import ProcessingPage from "./pages/Processing/ProcessingPage";
import DecisionsPage from "./pages/Decisions/DecisionsPage";
import PositionsPage from "./pages/Positions/PositionsPage";
import KnowledgePage from "./pages/Knowledge/KnowledgePage";
import AgentsPage from "./pages/Agents/AgentsPage";
import ToolsPage from "./pages/Tools/ToolsPage";
import SettingsPage from "./pages/Settings/SettingsPage";
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
            <Route path="/" element={<PortfolioPage />} />
            <Route path="/processing" element={<ProcessingPage />} />
            <Route path="/decisions" element={<DecisionsPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/positions" element={<PositionsPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
