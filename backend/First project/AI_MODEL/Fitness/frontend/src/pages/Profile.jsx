import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";

export default function Profile() {
  const { token, user, setUser } = useAuth();
  const [form, setForm] = useState({ age: "", height: "", weight: "" });

  useEffect(() => {
    if (token) {
      apiFetch("/auth/me", {}, token).then((data) => {
        setUser(data);
        setForm({
          age: data.age ?? "",
          height: data.height ?? "",
          weight: data.weight ?? "",
        });
      }).catch(console.error);
    }
  }, [token, setUser]);

  const save = async () => {
    const payload = {
      age: form.age === "" ? null : Number(form.age),
      height: form.height === "" ? null : Number(form.height),
      weight: form.weight === "" ? null : Number(form.weight),
    };
    const updated = await apiFetch(
      "/auth/profile",
      { method: "PUT", body: JSON.stringify(payload) },
      token
    );
    setUser(updated);
    alert("Profile updated");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-lg space-y-6 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        
        {user && (
          <div className="rounded-2xl border border-white/20 bg-slate-900/50 p-5 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-cyan-300">{user.username}</h2>
            <p className="text-slate-400">{user.email}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-300">
                ⭐ {user.total_reps ?? 0} Total Reps
              </span>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl space-y-5">
          <h3 className="text-lg font-medium text-slate-200">Body Metrics</h3>
          
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Age</span>
            <input
              type="number"
              className="w-full rounded-xl border border-white/20 bg-slate-900/70 p-3 outline-none transition focus:border-cyan-400"
              placeholder="e.g. 28"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
          </label>
          
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Height (cm)</span>
            <input
              type="number"
              className="w-full rounded-xl border border-white/20 bg-slate-900/70 p-3 outline-none transition focus:border-cyan-400"
              placeholder="e.g. 175"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
            />
          </label>
          
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Weight (kg)</span>
            <input
              type="number"
              className="w-full rounded-xl border border-white/20 bg-slate-900/70 p-3 outline-none transition focus:border-cyan-400"
              placeholder="e.g. 70"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
            />
          </label>
          
          <button
            className="w-full rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white shadow-lg transition hover:bg-cyan-500 hover:shadow-cyan-500/25 mt-2"
            onClick={save}
          >
            Save Metrics
          </button>
        </div>
      </div>
    </div>
  );
}
