import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8012";
const WS_BASE = API_BASE.replace(/^http/, "ws");

export default function Duel() {
  const { token, user } = useAuth();
  const wsRef = useRef(null);

  const [targetId, setTargetId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [myReps, setMyReps] = useState(0);
  const [syncReps, setSyncReps] = useState({});
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/duel?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, JSON.stringify(data)]);

      if (data.type === "invited") {
        if (window.confirm(`User ${data.from_user_id} invited you. Accept?`)) {
          ws.send(
            JSON.stringify({ type: "accept_invite", from_user_id: data.from_user_id })
          );
        }
      }

      if (data.type === "duel_started") {
        setRoomId(data.room_id);
        setMyReps(0);
      }

      if (data.type === "rep_sync") {
        setSyncReps(data.reps);
      }

      if (data.type === "duel_result") {
        const winnerText = data.winner ? `Winner is user ${data.winner}` : "Draw";
        alert(winnerText);
      }
    };

    return () => ws.close();
  }, [token]);

  const invite = () => {
    wsRef.current?.send(JSON.stringify({ type: "invite", to_user_id: Number(targetId) }));
  };

  const addRep = () => {
    const next = myReps + 1;
    setMyReps(next);
    wsRef.current?.send(JSON.stringify({ type: "rep_update", room_id: roomId, reps: next }));
  };

  const finish = () => {
    wsRef.current?.send(JSON.stringify({ type: "finish", room_id: roomId }));
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Real-time Duel (1v1)</h1>
        <p className="text-slate-300">Your user ID: {user?.id}</p>
        <div className="flex gap-2">
          <input
            className="rounded-xl border border-white/20 bg-slate-900/70 p-2.5 outline-none transition focus:border-cyan-400"
            placeholder="Invite user ID"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          />
          <button className="rounded-xl bg-indigo-500 px-4 transition hover:bg-indigo-400" onClick={invite}>
            Send Invite
          </button>
        </div>

        {roomId && (
          <div className="space-y-2 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
            <p>Room: {roomId}</p>
            <p>My reps: {myReps}</p>
            <p>Synced reps: {JSON.stringify(syncReps)}</p>
            <div className="flex gap-2">
              <button className="rounded-xl bg-emerald-600 px-4 py-2 transition hover:bg-emerald-500" onClick={addRep}>
                +1 Rep
              </button>
              <button className="rounded-xl bg-rose-500 px-4 py-2 transition hover:bg-rose-400" onClick={finish}>
                Finish Duel
              </button>
            </div>
          </div>
        )}

        <div className="max-h-60 overflow-auto rounded-2xl border border-white/20 bg-white/10 p-3 text-xs backdrop-blur-xl">
          {messages.map((m, i) => (
            <p key={i} className="border-b border-white/10 py-1 last:border-none">{m}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
