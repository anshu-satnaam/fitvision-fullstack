import { useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";

export default function Chatbot() {
  const { token } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi, I am your FitVision coach. Ask me anything about form." },
  ]);
  const [loading, setLoading] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const scrollRef = useRef(null);

  const getSessionStats = () => {
    try {
      const raw = localStorage.getItem("live_stats");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const pushMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 0);
  };

  const parseCoachPayload = (value) => {
    if (!value) {
      return null;
    }
    if (typeof value === "object") {
      return value;
    }
    if (typeof value !== "string") {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const renderCoachPayload = (payload) => {
    if (!payload || typeof payload !== "object") {
      return null;
    }
    if (payload.error) {
      return <p className="text-rose-300">{payload.error}</p>;
    }

    const causes = Array.isArray(payload.possible_causes) ? payload.possible_causes : [];
    const recommendations = Array.isArray(payload.recommendations) ? payload.recommendations : [];
    const avoid = Array.isArray(payload.avoid) ? payload.avoid : [];

    return (
      <div className="space-y-2">
        <p>
          <span className="font-semibold text-indigo-300">Analysis:</span> {payload.analysis}
        </p>
        {causes.length > 0 && (
          <div>
            <p className="font-semibold text-indigo-300">Possible Causes:</p>
            <ul className="list-disc pl-5 space-y-1">
              {causes.map((item, i) => (
                <li key={`cause-${i}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {recommendations.length > 0 && (
          <div>
            <p className="font-semibold text-emerald-300">Recommendations:</p>
            <ul className="list-disc pl-5 space-y-1">
              {recommendations.map((item, i) => (
                <li key={`recommendation-${i}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {avoid.length > 0 && (
          <div>
            <p className="font-semibold text-amber-300">Avoid:</p>
            <ul className="list-disc pl-5 space-y-1">
              {avoid.map((item, i) => (
                <li key={`avoid-${i}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {payload.follow_up_question && (
          <p>
            <span className="font-semibold text-cyan-300">Follow-up:</span> {payload.follow_up_question}
          </p>
        )}
      </div>
    );
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) {
      return;
    }
    setInput("");
    pushMessage("user", trimmed);
    setLoading(true);
    try {
      const sessionStats = getSessionStats();
      const res = await apiFetch(
        "/chatbot/message",
        {
          method: "POST",
          body: JSON.stringify({
            message: trimmed,
            session_reps: sessionStats.reps ?? null,
            current_exercise: sessionStats.exercise ?? null,
          }),
        },
        token
      );
      pushMessage("assistant", res?.response || res?.reply || "I could not generate a response.");
    } catch (err) {
      pushMessage("assistant", err?.message || "I could not respond right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startVoiceInput = () => {
    setVoiceError("");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setInput(transcript);
      sendMessage(transcript);
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setVoiceError("Microphone permission denied.");
      } else {
        setVoiceError("Voice recognition failed. Try again.");
      }
    };
    recognition.start();
  };

  return (
    <div className="min-h-screen text-slate-100">
      <Navbar />
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="flex h-[78vh] flex-col rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow ${
                    m.role === "user" ? "bg-indigo-500 text-white" : "border border-white/15 bg-slate-900/75"
                  }`}
                >
                  {m.role === "assistant" && parseCoachPayload(m.text)
                    ? renderCoachPayload(parseCoachPayload(m.text))
                    : m.text}
                </div>
              </div>
            ))}
            {loading && <p className="text-xs text-slate-400">Coach is typing...</p>}
          </div>
          <div className="border-t border-white/20 p-4">
            {voiceError && <p className="mb-2 text-xs text-amber-300">{voiceError}</p>}
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-2xl border border-white/20 bg-slate-900/75 px-4 py-2.5 outline-none transition focus:border-cyan-400"
                placeholder="Ask about workout, recovery, or posture..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage(input);
                  }
                }}
              />
              <button
                type="button"
                className="rounded-2xl bg-emerald-600 px-4 py-2.5 font-medium transition hover:bg-emerald-500"
                onClick={startVoiceInput}
              >
                Mic
              </button>
              <button
                type="button"
                className="rounded-2xl bg-indigo-600 px-4 py-2.5 font-medium transition hover:bg-indigo-500"
                onClick={() => sendMessage(input)}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
