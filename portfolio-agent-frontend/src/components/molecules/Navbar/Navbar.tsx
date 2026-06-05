import { useLocation, Link } from "react-router-dom";
import { navItems } from "./Navbar.interface";

export function Navbar() {
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
