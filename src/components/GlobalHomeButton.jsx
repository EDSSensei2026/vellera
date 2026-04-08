import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";

const HOME_PATHS = ["/", "/dashboard", "/landing"];

export default function GlobalHomeButton() {
  const { pathname } = useLocation();
  if (HOME_PATHS.includes(pathname)) return null;

  return (
    <Link
      to="/dashboard"
      className="fixed top-4 left-4 z-[9999] w-10 h-10 bg-commander-surface/90 backdrop-blur border border-commander-border rounded-full flex items-center justify-center text-white hover:border-vellera-blue hover:text-vellera-blue transition-all shadow-lg"
      title="Go to Dashboard"
    >
      <Home className="w-5 h-5" />
    </Link>
  );
}