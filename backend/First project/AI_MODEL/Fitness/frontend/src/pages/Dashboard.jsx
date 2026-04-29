import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";

export default function Dashboard() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [receiverId, setReceiverId] = useState("");
  const [stats, setStats] = useState({ reps: 0, streak: 1, rank: "-" });

  const loadSocial = async () => {
    const [reqs, fr, workouts, leaderboard] = await Promise.all([
      apiFetch("/social/requests", {}, token),
      apiFetch("/social/friends", {}, token),
      apiFetch("/workouts/me", {}, token),
      apiFetch("/leaderboard", {}, token),
    ]);
    setRequests(reqs);
    setFriends(fr);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const weeklyCount = workouts
      .filter((w) => new Date(w.created_at).getTime() >= thisWeek.getTime())
      .reduce((sum, w) => sum + w.reps, 0);
    const myRow = leaderboard.find((row) => row.id === user?.id);
    setStats({
      reps: user?.total_reps ?? 0,
      streak: weeklyCount > 0 ? 1 : 0,
      rank: myRow?.rank ?? "-",
    });
  };

  useEffect(() => {
    if (token) {
      loadSocial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const sendFriendRequest = async () => {
    await apiFetch(
      "/social/request",
      {
        method: "POST",
        body: JSON.stringify({ receiver_id: Number(receiverId) }),
      },
      token
    );
    setReceiverId("");
    alert("Friend request sent");
  };

  const respond = async (requestId, action) => {
    await apiFetch(
      "/social/respond",
      {
        method: "POST",
        body: JSON.stringify({ request_id: requestId, action }),
      },
      token
    );
    loadSocial();
  };

  return (
    <div className="min-h-screen text-slate-100">
      <Navbar />
      <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
            <p className="text-slate-300 text-sm">Total Reps</p>
            <p className="text-3xl font-bold">{stats.reps}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
            <p className="text-slate-300 text-sm">Streak</p>
            <p className="text-3xl font-bold">{stats.streak} day</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
            <p className="text-slate-300 text-sm">Leaderboard Rank</p>
            <p className="text-3xl font-bold">#{stats.rank}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
            <h2 className="font-semibold text-lg">Welcome, {user?.username}</h2>
            <p className="text-slate-300 text-sm">Manage your social fitness circle.</p>
            <div className="mt-3 flex gap-2">
              <input
                className="w-44 rounded-xl border border-white/20 bg-slate-900/70 p-2.5 outline-none transition focus:border-cyan-400"
                placeholder="Friend user ID"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
              />
              <button
                onClick={sendFriendRequest}
                className="rounded-xl bg-indigo-500 px-4 text-sm font-medium transition hover:bg-indigo-400"
              >
                Send Request
              </button>
            </div>
            <h3 className="mt-4 font-medium">Pending Requests</h3>
            {requests.length === 0 && <p className="text-sm text-slate-400">No pending requests.</p>}
            {requests.map((r) => (
              <div key={r.id} className="flex justify-between text-sm py-1">
                <span>
                  {r.sender_username} (id: {r.sender_id})
                </span>
                <div className="space-x-2">
                  <button className="text-green-400" onClick={() => respond(r.id, "accept")}>
                    Accept
                  </button>
                  <button className="text-rose-400" onClick={() => respond(r.id, "reject")}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
            <h3 className="font-medium">Friends</h3>
            <div className="mt-2 space-y-2">
              {friends.length === 0 && <p className="text-sm text-slate-400">No friends yet.</p>}
              {friends.map((f) => (
                <div key={f.id} className="rounded-xl border border-white/10 bg-slate-900/55 p-3 text-sm">
                  <p className="font-medium">{f.username}</p>
                  <p className="text-slate-300">{f.total_reps} reps</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
