import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200 md:gap-4 md:text-base">
          <Link to="/dashboard" className="font-semibold text-cyan-300 transition hover:text-cyan-200">
          FitVision Lite
        </Link>
          <Link className="transition hover:text-cyan-200" to="/workout">Live Workout</Link>
          <Link className="transition hover:text-cyan-200" to="/chatbot">Chatbot</Link>
          <Link className="transition hover:text-cyan-200" to="/duel">Duel</Link>
          <Link className="transition hover:text-cyan-200" to="/leaderboard">Leaderboard</Link>
          <Link className="transition hover:text-cyan-200" to="/profile">Profile</Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200 md:text-sm">
            {user?.username || "User"}
          </span>
          <button
            onClick={logout}
            className="rounded-xl bg-rose-500/90 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-rose-500"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
