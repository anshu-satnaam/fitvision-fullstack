import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";

export default function Signup() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify(form),
      });
      login(data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl"
      >
        <h1 className="text-3xl font-bold tracking-tight">AI Fitness Trainer</h1>
        <p className="text-sm text-slate-300">Start tracking workouts and coaching in real time.</p>
        <input
          className="w-full rounded-2xl border border-white/20 bg-slate-900/70 px-4 py-3 outline-none transition focus:border-cyan-400"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          className="w-full rounded-2xl border border-white/20 bg-slate-900/70 px-4 py-3 outline-none transition focus:border-cyan-400"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="w-full rounded-2xl border border-white/20 bg-slate-900/70 px-4 py-3 outline-none transition focus:border-cyan-400"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="text-rose-400 text-sm">{error}</p>}
        <button className="w-full rounded-2xl bg-indigo-500 py-3 font-medium transition hover:bg-indigo-400">
          Create Account
        </button>
        <p className="text-sm">
          Already registered?{" "}
          <Link className="text-cyan-300 hover:text-cyan-200" to="/">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
