import { useEffect, useRef, useState } from "react";
import { Pose } from "@mediapipe/pose";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";

export default function LiveWorkout() {
  const { token } = useAuth();
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const poseRef = useRef(null);
  const rafRef = useRef(null);
  const frameCounterRef = useRef(0);
  const runningRef = useRef(false);
  const repStateRef = useRef("up");
  const lastAngleRef = useRef(180);
  const totalStabilityRef = useRef(0);
  const stabilitySamplesRef = useRef(0);
  const angleSamplesRef = useRef([]);
  const lastAiCallRef = useRef(0);
  const sessionIdRef = useRef("");
  const repsRef = useRef(0);
  const recognitionRef = useRef(null);
  const recognitionTimeoutRef = useRef(null);

  const [exercise, setExercise] = useState("squats");
  const [sessionId, setSessionId] = useState("");
  const [reps, setReps] = useState(0);
  const [postureFeedback, setPostureFeedback] = useState("Keep a steady rhythm.");
  const [aiFeedback, setAiFeedback] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [voiceInput, setVoiceInput] = useState("");
  const [coachReply, setCoachReply] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);

  useEffect(() => {
    repsRef.current = reps;
    localStorage.setItem("live_stats", JSON.stringify({ reps, exercise }));
  }, [reps, exercise]);

  const POSE_CONNECTIONS = [
    [11, 12],
    [11, 13],
    [13, 15],
    [12, 14],
    [14, 16],
    [11, 23],
    [12, 24],
    [23, 24],
    [23, 25],
    [25, 27],
    [24, 26],
    [26, 28],
    [27, 31],
    [28, 32],
  ];

  const angle = (a, b, c) => {
    const ab = [a.x - b.x, a.y - b.y];
    const cb = [c.x - b.x, c.y - b.y];
    const dot = ab[0] * cb[0] + ab[1] * cb[1];
    const abNorm = Math.hypot(ab[0], ab[1]);
    const cbNorm = Math.hypot(cb[0], cb[1]);
    if (!abNorm || !cbNorm) {
      return 180;
    }
    const cos = Math.max(-1, Math.min(1, dot / (abNorm * cbNorm)));
    return (Math.acos(cos) * 180) / Math.PI;
  };

  const getExerciseAngle = (landmarks, mode) => {
    if (mode === "squats") {
      const left = angle(landmarks[23], landmarks[25], landmarks[27]);
      const right = angle(landmarks[24], landmarks[26], landmarks[28]);
      return (left + right) / 2;
    }
    const left = angle(landmarks[11], landmarks[13], landmarks[15]);
    const right = angle(landmarks[12], landmarks[14], landmarks[16]);
    return (left + right) / 2;
  };

  const drawSkeleton = (landmarks) => {
    if (!overlayCanvasRef.current || !videoRef.current) {
      return;
    }
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = videoRef.current.videoWidth || 640;
    const height = videoRef.current.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    if (!landmarks?.length || landmarks.length < 33) {
      return;
    }

    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3;
    for (const [a, b] of POSE_CONNECTIONS) {
      const p1 = landmarks[a];
      const p2 = landmarks[b];
      if (!p1 || !p2) {
        continue;
      }
      if ((p1.visibility ?? 1) < 0.3 || (p2.visibility ?? 1) < 0.3) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }

    ctx.fillStyle = "#38bdf8";
    for (const p of landmarks) {
      if (!p || (p.visibility ?? 1) < 0.3) {
        continue;
      }
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const maybeRequestAiFeedback = async (currentReps, mode, force = false) => {
    const now = Date.now();
    if (!force && now - lastAiCallRef.current < 8000) {
      return;
    }
    if (angleSamplesRef.current.length === 0) {
      return;
    }
    lastAiCallRef.current = now;
    const avgAngle =
      angleSamplesRef.current.reduce((sum, v) => sum + v, 0) / angleSamplesRef.current.length;
    const avgStability =
      stabilitySamplesRef.current > 0
        ? totalStabilityRef.current / stabilitySamplesRef.current
        : 1;
    setAiLoading(true);
    try {
      const res = await apiFetch(
        "/ai/posture-feedback",
        {
          method: "POST",
          body: JSON.stringify({
            exercise: mode === "squats" ? "squat" : "pushup",
            avg_angle: Number(avgAngle.toFixed(2)),
            reps: currentReps,
            stability: Number(avgStability.toFixed(2)),
          }),
        },
        token
      );
      setAiFeedback(res.feedback);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const onPoseResults = async (results, mode) => {
    const landmarks = results?.poseLandmarks || [];
    drawSkeleton(landmarks);
    if (landmarks.length < 33) {
      return;
    }

    const currentAngle = getExerciseAngle(landmarks, mode);
    angleSamplesRef.current.push(currentAngle);
    if (angleSamplesRef.current.length > 120) {
      angleSamplesRef.current.shift();
    }

    const stability = 1 - Math.min(1, Math.abs(currentAngle - lastAngleRef.current) / 45);
    totalStabilityRef.current += stability;
    stabilitySamplesRef.current += 1;
    lastAngleRef.current = currentAngle;

    let ruleFeedback = "Good pace. Keep your core stable.";
    let nextReps = repsRef.current;
    if (mode === "squats") {
      if (currentAngle < 90) {
        repStateRef.current = "down";
      }
      if (currentAngle > 160 && repStateRef.current === "down") {
        repStateRef.current = "up";
        nextReps += 1;
      }
      if (currentAngle > 120) {
        ruleFeedback = "Go lower";
      }
    } else {
      if (currentAngle < 95) {
        repStateRef.current = "down";
      }
      if (currentAngle > 155 && repStateRef.current === "down") {
        repStateRef.current = "up";
        nextReps += 1;
      }
      if (currentAngle > 120) {
        ruleFeedback = "Lower more";
      }
    }
    if (nextReps !== repsRef.current) {
      repsRef.current = nextReps;
      setReps(nextReps);
    }
    setPostureFeedback(ruleFeedback);
    maybeRequestAiFeedback(repsRef.current, mode, false);
  };

  const initPose = async (mode) => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    pose.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    pose.onResults((results) => {
      onPoseResults(results, mode);
    });
    poseRef.current = pose;
  };

  const startCamera = async () => {
    const started = await apiFetch(
      "/workouts/start",
      { method: "POST", body: JSON.stringify({ exercise }) },
      token
    );
    sessionIdRef.current = started.session_id;
    setSessionId(started.session_id);
    setReps(0);
    repsRef.current = 0;
    setAiFeedback("");
    setPostureFeedback("Keep a steady rhythm.");
    repStateRef.current = "up";
    lastAngleRef.current = 180;
    totalStabilityRef.current = 0;
    stabilitySamplesRef.current = 0;
    angleSamplesRef.current = [];
    lastAiCallRef.current = 0;

    await initPose(exercise);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });
    streamRef.current = stream;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();

    runningRef.current = true;
    frameCounterRef.current = 0;

    const frameLoop = async () => {
      if (!runningRef.current || !videoRef.current || !poseRef.current) {
        return;
      }
      frameCounterRef.current += 1;
      if (frameCounterRef.current % 2 === 0) {
        await poseRef.current.send({ image: videoRef.current });
      }
      rafRef.current = requestAnimationFrame(frameLoop);
    };
    rafRef.current = requestAnimationFrame(frameLoop);
  };

  const stopCamera = async () => {
    runningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }
    if (sessionIdRef.current) {
      try {
        await apiFetch(
          "/workouts/end",
          {
            method: "POST",
            body: JSON.stringify({ session_id: sessionIdRef.current, reps: repsRef.current }),
          },
          token
        );
      } catch (_) {
      }
    }
    if (overlayCanvasRef.current && videoRef.current) {
      const ctx = overlayCanvasRef.current.getContext("2d");
      ctx.clearRect(
        0,
        0,
        videoRef.current.videoWidth || 640,
        videoRef.current.videoHeight || 480
      );
    }
    sessionIdRef.current = "";
    setSessionId("");
  };

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch (_) {
      }
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
        recognitionTimeoutRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestAiNow = async () => {
    await maybeRequestAiFeedback(reps, exercise, true);
  };

  const speak = (text) => {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const normalizeCoachReply = (rawReply) => {
    if (!rawReply) {
      return "Keep your form controlled and tell me what feels wrong.";
    }
    if (typeof rawReply === "object") {
      const action =
        rawReply.recommendations?.[0] ||
        rawReply.analysis ||
        rawReply.follow_up_question ||
        "Keep your form controlled and breathe steadily.";
      return String(action).replace(/^Coach:\s*/i, "").trim();
    }
    const text = String(rawReply).trim();
    const stripped = text.replace(/^Coach:\s*/i, "");
    try {
      const parsed = JSON.parse(stripped);
      const action =
        parsed.recommendations?.[0] ||
        parsed.analysis ||
        parsed.follow_up_question ||
        "Keep your form controlled and breathe steadily.";
      return String(action).trim();
    } catch (_) {
      return stripped;
    }
  };

  const askCoach = async (rawText) => {
    const message = (rawText || "").trim();
    if (!message || !sessionIdRef.current || coachLoading) {
      return;
    }
    setVoiceError("");
    setCoachLoading(true);
    try {
      const res = await apiFetch(
        "/chatbot/message",
        {
          method: "POST",
          body: JSON.stringify({
            message,
            session_reps: repsRef.current,
            current_exercise: exercise,
          }),
        },
        token
      );
      const reply = normalizeCoachReply(res?.reply);
      setCoachReply(reply);
      speak(reply);
    } catch (err) {
      setVoiceError(err?.message || "Coach request failed.");
    } finally {
      setCoachLoading(false);
    }
  };

  const startVoiceInput = () => {
    setVoiceError("");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Voice input is not supported in this browser.");
      return;
    }
    if (!sessionIdRef.current) {
      setVoiceError("Start a workout session before using voice coach.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError("Microphone is not available in this browser.");
      return;
    }

    try {
      recognitionRef.current?.stop();
    } catch (_) {
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    let finalTranscript = "";
    let gotFinal = false;

    recognition.onstart = () => {
      setVoiceListening(true);
    };
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result?.[0]?.transcript || "";
        if (result.isFinal) {
          finalTranscript += ` ${text}`;
          gotFinal = true;
        } else {
          interim += ` ${text}`;
        }
      }
      const current = (finalTranscript || interim).trim();
      if (current) {
        setVoiceInput(current);
      }
      if (gotFinal) {
        const transcript = finalTranscript.trim();
        if (transcript) {
          askCoach(transcript);
        }
        recognition.stop();
      }
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setVoiceError("Microphone permission denied.");
      } else if (event.error === "no-speech") {
        setVoiceError("No speech detected. Try again.");
      } else {
        setVoiceError("Voice recognition failed. Try again.");
      }
    };
    recognition.onend = () => {
      setVoiceListening(false);
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
        recognitionTimeoutRef.current = null;
      }
      if (!gotFinal) {
        setVoiceError("No clear speech detected. Please try again.");
      }
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
        try {
          recognition.start();
          recognitionTimeoutRef.current = setTimeout(() => {
            try {
              recognition.stop();
            } catch (_) {
            }
          }, 9000);
        } catch (_) {
          setVoiceListening(false);
          setVoiceError("Could not start voice recognition.");
        }
      })
      .catch(() => {
        setVoiceError("Microphone permission denied.");
      });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Live Workout</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-xl border border-white/20 bg-slate-900/70 p-2.5 outline-none transition focus:border-cyan-400"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            disabled={Boolean(sessionId)}
          >
            <option value="squats">Squats</option>
            <option value="pushups">Pushups</option>
          </select>
          <button
            className="rounded-xl bg-indigo-500 px-4 py-2 font-medium transition hover:bg-indigo-400 disabled:opacity-60"
            disabled={Boolean(sessionId)}
            onClick={startCamera}
          >
            Start Camera
          </button>
          <button
            className="rounded-xl bg-rose-500 px-4 py-2 font-medium transition hover:bg-rose-400 disabled:opacity-60"
            disabled={!sessionId}
            onClick={stopCamera}
          >
            Stop
          </button>
          <button
            className="rounded-xl bg-emerald-600 px-4 py-2 font-medium transition hover:bg-emerald-500 disabled:opacity-60"
            disabled={!sessionId || aiLoading}
            onClick={requestAiNow}
          >
            {aiLoading ? "Checking..." : "Check AI Feedback"}
          </button>
          <button
            className="rounded-xl bg-cyan-600 px-4 py-2 font-medium transition hover:bg-cyan-500 disabled:opacity-60"
            disabled={!sessionId || voiceListening}
            onClick={startVoiceInput}
          >
            {voiceListening ? "Listening..." : "Voice Coach"}
          </button>
        </div>
        <div className="relative w-full overflow-hidden rounded-3xl border border-white/20 bg-white/5 shadow-2xl backdrop-blur-xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-h-[78vh] object-contain rounded border border-slate-700 bg-black"
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute left-0 top-0 h-full w-full pointer-events-none"
          />
          <div className="absolute left-4 top-4 rounded-xl border border-white/20 bg-black/55 px-4 py-2 backdrop-blur">
            <p className="text-sm text-slate-200">Reps</p>
            <p className="text-4xl font-bold">{reps}</p>
          </div>
          <div className="absolute bottom-4 left-4 max-w-md rounded-xl border border-white/20 bg-black/55 px-4 py-2 text-sm backdrop-blur">
            <p className="font-semibold text-cyan-300">Posture</p>
            <p>{postureFeedback}</p>
            {aiFeedback && <p className="mt-2 text-emerald-300">AI: {aiFeedback}</p>}
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
          <p className="text-sm font-semibold text-cyan-300">Live Voice Coach</p>
          {voiceError && <p className="text-xs text-amber-300">{voiceError}</p>}
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-white/20 bg-slate-900/70 p-2.5 outline-none transition focus:border-cyan-400"
              placeholder="Ask coach: Am I doing this right?"
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  askCoach(voiceInput);
                }
              }}
              disabled={!sessionId}
            />
            <button
              className="rounded-xl bg-indigo-600 px-4 py-2 font-medium transition hover:bg-indigo-500 disabled:opacity-60"
              disabled={!sessionId || coachLoading}
              onClick={() => askCoach(voiceInput)}
            >
              {coachLoading ? "Asking..." : "Ask"}
            </button>
          </div>
          {coachReply && <p className="text-sm text-emerald-300">Coach: {coachReply}</p>}
        </div>
      </div>
    </div>
  );
}
