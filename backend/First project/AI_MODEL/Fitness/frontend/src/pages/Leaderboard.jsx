import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    apiFetch("/leaderboard").then(setRows).catch(console.error);
  }, []);

  const getRankBadge = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  const getRankColor = (index) => {
    if (index === 0) return "text-yellow-400 font-bold";
    if (index === 1) return "text-slate-300 font-bold";
    if (index === 2) return "text-amber-600 font-bold";
    return "text-cyan-300 font-medium";
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            Global Leaderboard
          </h1>
          <p className="text-slate-400">Compete with athletes worldwide. Can you reach the top?</p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/20 bg-slate-900/40 shadow-2xl backdrop-blur-xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-slate-300 text-sm uppercase tracking-wider">
              <tr>
                <th className="p-5 font-semibold">Rank</th>
                <th className="p-5 font-semibold">Athlete</th>
                <th className="p-5 font-semibold text-right">Total Reps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r, i) => {
                const isMe = user?.username === r.username;
                return (
                  <tr 
                    key={r.id} 
                    className={`transition-colors duration-200 ${
                      isMe ? "bg-indigo-500/20 hover:bg-indigo-500/30" : "hover:bg-white/5"
                    }`}
                  >
                    <td className={`p-5 text-xl ${getRankColor(i)}`}>
                      {getRankBadge(i)}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-bold shadow-lg">
                          {r.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-semibold ${isMe ? "text-indigo-300" : "text-slate-100"}`}>
                            {r.username} {isMe && "(You)"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-right font-mono text-lg font-medium text-emerald-400">
                      {r.total_reps.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-slate-400">
                    No data available. Start working out to get on the board!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
