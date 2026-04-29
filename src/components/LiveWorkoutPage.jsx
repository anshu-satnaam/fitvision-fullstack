import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import DashboardNav from './DashboardNav'
import DashboardMascot from './DashboardMascot'
import FloatingParticles from './FloatingParticles'
import { workoutAPI, chatbotAPI, getToken } from '../api'

const EXERCISES = ['Squats', 'Push-ups']

export default function LiveWorkoutPage() {
  const [reps, setReps] = useState(0)
  const [exercise, setExercise] = useState('Squats')
  const [postureTip, setPostureTip] = useState('Keep a steady rhythm.')
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [coachMessages, setCoachMessages] = useState([
    { from: 'coach', text: 'Welcome back! Hit \'Start Session\' to begin and I will track your form.' },
  ])
  const [coachInput, setCoachInput] = useState('')
  const [repFlash, setRepFlash] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [voiceListening, setVoiceListening] = useState(false)
  const [coachLoading, setCoachLoading] = useState(false)

  const cardRef = useRef(null)
  const messagesEndRef = useRef(null)

  // MediaPipe Refs
  const videoRef = useRef(null)
  const overlayCanvasRef = useRef(null)
  const streamRef = useRef(null)
  const poseRef = useRef(null)
  const rafRef = useRef(null)
  const frameCounterRef = useRef(0)
  const runningRef = useRef(false)
  const repStateRef = useRef("up")
  const lastAngleRef = useRef(180)
  const totalStabilityRef = useRef(0)
  const stabilitySamplesRef = useRef(0)
  const angleSamplesRef = useRef([])
  const lastAiCallRef = useRef(0)
  const repsRef = useRef(0)
  const recognitionRef = useRef(null)
  const recognitionTimeoutRef = useRef(null)
  
  // WebSocket Chatbot Ref
  const wsRef = useRef(null)

  useEffect(() => {
    repsRef.current = reps
  }, [reps])

  // Connect Chatbot WebSocket
  useEffect(() => {
    const connectWs = () => {
      const token = getToken()
      if (!token) return
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      // Use standard location port if possible, or fallback to backend port in dev
      const host = window.location.host.includes('5174') ? '127.0.0.1:8000' : window.location.host
      const ws = new WebSocket(`${protocol}//${host}/api/chatbot/ws/${token}`)
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'stream_chunk') {
          setCoachMessages(prev => {
            const newMsgs = [...prev]
            const last = newMsgs[newMsgs.length - 1]
            if (last && last.from === 'coach' && last.isStreaming) {
              last.text += data.content
            } else {
              newMsgs.push({ from: 'coach', text: data.content, isStreaming: true })
            }
            return newMsgs
          })
        } else if (data.type === 'stream_end') {
          setCoachMessages(prev => {
            const newMsgs = [...prev]
            const last = newMsgs[newMsgs.length - 1]
            if (last && last.isStreaming) {
              last.isStreaming = false
              speak(last.text)
            }
            return newMsgs
          })
          setCoachLoading(false)
        } else if (data.type === 'error') {
          setCoachLoading(false)
        }
      }
      wsRef.current = ws
    }
    connectWs()
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  // 3D parallax on mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!cardRef.current) return
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      cardRef.current.style.transform = `rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateZ(10px)`
    }
    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Scroll to bottom of chat but strictly container only
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement
      if (container) container.scrollTop = container.scrollHeight
    }
  }, [coachMessages])

  const POSE_CONNECTIONS = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
    [24, 26], [26, 28], [27, 31], [28, 32]
  ]

  const angle = (a, b, c) => {
    const ab = [a.x - b.x, a.y - b.y]
    const cb = [c.x - b.x, c.y - b.y]
    const dot = ab[0] * cb[0] + ab[1] * cb[1]
    const abNorm = Math.hypot(ab[0], ab[1])
    const cbNorm = Math.hypot(cb[0], cb[1])
    if (!abNorm || !cbNorm) return 180
    const cos = Math.max(-1, Math.min(1, dot / (abNorm * cbNorm)))
    return (Math.acos(cos) * 180) / Math.PI
  }

  const getExerciseAngle = (landmarks, mode) => {
    if (mode === "squats") {
      const left = angle(landmarks[23], landmarks[25], landmarks[27])
      const right = angle(landmarks[24], landmarks[26], landmarks[28])
      return (left + right) / 2
    }
    const left = angle(landmarks[11], landmarks[13], landmarks[15])
    const right = angle(landmarks[12], landmarks[14], landmarks[16])
    return (left + right) / 2
  }

  const drawSkeleton = (landmarks) => {
    if (!overlayCanvasRef.current || !videoRef.current) return
    const canvas = overlayCanvasRef.current
    const ctx = canvas.getContext("2d")
    const width = videoRef.current.videoWidth || 640
    const height = videoRef.current.videoHeight || 480

    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)

    if (!landmarks?.length || landmarks.length < 33) return

    ctx.strokeStyle = "#22c55e"
    ctx.lineWidth = 3
    for (const [a, b] of POSE_CONNECTIONS) {
      const p1 = landmarks[a]
      const p2 = landmarks[b]
      if (!p1 || !p2) continue
      if ((p1.visibility ?? 1) < 0.3 || (p2.visibility ?? 1) < 0.3) continue
      ctx.beginPath()
      ctx.moveTo(p1.x * width, p1.y * height)
      ctx.lineTo(p2.x * width, p2.y * height)
      ctx.stroke()
    }

    ctx.fillStyle = "#38bdf8"
    for (const p of landmarks) {
      if (!p || (p.visibility ?? 1) < 0.3) continue
      ctx.beginPath()
      ctx.arc(p.x * width, p.y * height, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const maybeRequestAiFeedback = async (currentReps, mode, force = false) => {
    const now = Date.now()
    if (!force && now - lastAiCallRef.current < 8000) return
    
    // Default angles if camera wasn't used yet
    const avgAngle = angleSamplesRef.current.length > 0 ? (angleSamplesRef.current.reduce((sum, v) => sum + v, 0) / angleSamplesRef.current.length) : 180
    const avgStability = stabilitySamplesRef.current > 0 ? totalStabilityRef.current / stabilitySamplesRef.current : 1
    
    lastAiCallRef.current = now
    setAiLoading(true)
    try {
      const ex = mode === "squats" ? "squat" : "pushup"
      const res = await workoutAPI.postureFeedback(ex, Number(avgAngle.toFixed(2)), currentReps, Number(avgStability.toFixed(2)))
      setCoachMessages(prev => [...prev, { from: 'coach', text: `AI Insight: ${res.feedback}` }])
    } catch (err) {
      console.error(err)
      setCoachMessages(prev => [...prev, { from: 'coach', text: 'Error connecting to AI Backend.' }])
    } finally {
      setAiLoading(false)
    }
  }

  const onPoseResults = async (results, mode) => {
    const landmarks = results?.poseLandmarks || []
    drawSkeleton(landmarks)
    if (landmarks.length < 33) return

    const currentAngle = getExerciseAngle(landmarks, mode)
    angleSamplesRef.current.push(currentAngle)
    if (angleSamplesRef.current.length > 120) angleSamplesRef.current.shift()

    const stability = 1 - Math.min(1, Math.abs(currentAngle - lastAngleRef.current) / 45)
    totalStabilityRef.current += stability
    stabilitySamplesRef.current += 1
    lastAngleRef.current = currentAngle

    let ruleFeedback = "Good pace. Keep your core stable."
    let nextReps = repsRef.current

    if (mode === "squats") {
      if (currentAngle < 90) repStateRef.current = "down"
      if (currentAngle > 160 && repStateRef.current === "down") {
        repStateRef.current = "up"
        nextReps += 1
      }
      if (currentAngle > 120) ruleFeedback = "Go lower"
    } else {
      if (currentAngle < 95) repStateRef.current = "down"
      if (currentAngle > 155 && repStateRef.current === "down") {
        repStateRef.current = "up"
        nextReps += 1
      }
      if (currentAngle > 120) ruleFeedback = "Lower more"
    }

    if (nextReps !== repsRef.current) {
      repsRef.current = nextReps
      setReps(nextReps)
      setRepFlash(true)
      setTimeout(() => setRepFlash(false), 300)
    }
    setPostureTip(ruleFeedback)
    maybeRequestAiFeedback(repsRef.current, mode, false)
  }

  const initPose = async (mode) => {
    const Pose = window.Pose;
    if (!Pose) {
      console.error("MediaPipe Pose not loaded");
      return;
    }
    const pose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` })
    pose.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })
    pose.onResults((results) => onPoseResults(results, mode))
    poseRef.current = pose
  }

  const startSession = async () => {
    try {
      const ex = exercise.toLowerCase().replace('-', '')
      const data = await workoutAPI.startSession(ex)
      setSessionId(data.session_id)
      setSessionActive(true)
      setReps(0)
      repsRef.current = 0
      setCoachMessages(prev => [...prev, { from: 'coach', text: `Camera initialized. Starting ${exercise}. Show me what you got!` }])
      
      repStateRef.current = "up"
      lastAngleRef.current = 180
      totalStabilityRef.current = 0
      stabilitySamplesRef.current = 0
      angleSamplesRef.current = []
      lastAiCallRef.current = 0

      await initPose(ex)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      runningRef.current = true
      frameCounterRef.current = 0

      const frameLoop = async () => {
        if (!runningRef.current || !videoRef.current || !poseRef.current) return
        frameCounterRef.current += 1
        if (frameCounterRef.current % 2 === 0) {
          await poseRef.current.send({ image: videoRef.current })
        }
        rafRef.current = requestAnimationFrame(frameLoop)
      }
      rafRef.current = requestAnimationFrame(frameLoop)

    } catch (err) {
      setCoachMessages(prev => [...prev, { from: 'coach', text: 'Error starting camera or session.' }])
    }
  }

  const stopSession = async () => {
    setSessionActive(false)
    runningRef.current = false
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (poseRef.current) {
      poseRef.current.close()
      poseRef.current = null
    }

    try {
      if (sessionId) {
        await workoutAPI.endSession(sessionId, reps)
      } else {
        await workoutAPI.logWorkout(exercise.toLowerCase(), reps)
      }
      setCoachMessages(prev => [...prev, { from: 'coach', text: `Great work! ${reps} reps saved to your profile. Rest up!` }])
    } catch {
      setCoachMessages(prev => [...prev, { from: 'coach', text: `Session ended. ${reps} reps recorded locally.` }])
    }
    setSessionId(null)
    
    if (overlayCanvasRef.current && videoRef.current) {
      const ctx = overlayCanvasRef.current.getContext("2d")
      ctx.clearRect(0, 0, videoRef.current.videoWidth || 640, videoRef.current.videoHeight || 480)
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop() } catch (_) {}
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current)
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      stopSession()
    }
  }, [])

  const speak = (text) => {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  const sendCoachMessage = async (msgOverride) => {
    const text = (msgOverride || coachInput).trim()
    if (!text) return
    if (!msgOverride) {
      setCoachMessages(prev => [...prev, { from: 'user', text }])
      setCoachInput('')
    }
    setCoachLoading(true)
    
    // Send to WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content: text }))
    } else {
      // Fallback to HTTP if WS is dead
      try {
        const data = await chatbotAPI.send(text, reps, exercise)
        const reply = data.reply.replace(/^Coach:\s*/i, "").trim()
        setCoachMessages(prev => [...prev, { from: 'coach', text: reply }])
        speak(reply)
      } catch {
        setCoachMessages(prev => [...prev, { from: 'coach', text: 'Connection issue. But you are doing great!' }])
      }
      setCoachLoading(false)
    }
  }

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setCoachMessages(prev => [...prev, { from: 'coach', text: 'Voice input is not supported in this browser.' }])
      return
    }
    try { recognitionRef.current?.stop() } catch (_) {}
    if (window.speechSynthesis) window.speechSynthesis.cancel()

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    let finalTranscript = ""
    let gotFinal = false

    recognition.onstart = () => setVoiceListening(true)
    recognition.onresult = (event) => {
      let interim = ""
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result?.[0]?.transcript || ""
        if (result.isFinal) {
          finalTranscript += ` ${text}`
          gotFinal = true
        } else {
          interim += ` ${text}`
        }
      }
      const current = (finalTranscript || interim).trim()
      if (current && !gotFinal) setCoachInput(current)
      
      if (gotFinal) {
        const transcript = finalTranscript.trim()
        if (transcript) {
          setCoachMessages(prev => [...prev, { from: 'user', text: transcript }])
          setCoachInput('')
          sendCoachMessage(transcript)
        }
        recognition.stop()
      }
    }
    recognition.onerror = () => setCoachMessages(prev => [...prev, { from: 'coach', text: 'Voice recognition failed.' }])
    recognition.onend = () => {
      setVoiceListening(false)
      if (recognitionTimeoutRef.current) clearTimeout(recognitionTimeoutRef.current)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      stream.getTracks().forEach((track) => track.stop())
      recognition.start()
      recognitionTimeoutRef.current = setTimeout(() => { try { recognition.stop() } catch (_) {} }, 9000)
    }).catch(() => setCoachMessages(prev => [...prev, { from: 'coach', text: 'Microphone permission denied.' }]))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#12080d', color: 'white', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FloatingParticles />

      <DashboardNav />

      {/* Main */}
      <main style={{ flex: 1, padding: '2.5rem', maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <header style={{ marginBottom: '2rem' }}>
          <h1 className="heading" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 1, marginBottom: '1.25rem' }}>
            Live <span style={{ color: '#d4a574' }}>Workout</span>
          </h1>

          {/* Controls bar */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem',
            padding: '0.5rem',
            background: 'rgba(42,18,32,0.4)',
            borderRadius: '1.25rem',
            border: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
          }}>
            {/* Exercise select */}
            <div style={{ position: 'relative', minWidth: '160px' }}>
              <select
                id="exercise-select"
                value={exercise}
                onChange={e => setExercise(e.target.value)}
                disabled={sessionActive}
                style={{
                  width: '100%',
                  background: '#12080d',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 2.5rem 0.75rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#d4a574',
                  appearance: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  opacity: sessionActive ? 0.5 : 1,
                }}
              >
                {EXERCISES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>
              <Icon icon="lucide:chevron-down" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#d4a574', pointerEvents: 'none' }} />
            </div>

            <CtaButton id="btn-start-camera" icon="lucide:camera" label={sessionActive ? 'Active ✓' : 'Start Session'} primary onClick={sessionActive ? undefined : startSession} />
            <CtaButton id="btn-stop" icon="lucide:square" label="Stop" variant="danger" onClick={stopSession} />
            <CtaButton id="btn-ai-feedback" icon="lucide:brain" label={aiLoading ? "Checking..." : "AI Feedback"} variant="emerald" onClick={() => maybeRequestAiFeedback(reps, exercise.toLowerCase().replace('-', ''), true)} />
            <CtaButton id="btn-voice-coach" icon="lucide:mic" label={voiceListening ? "Listening..." : "Voice Coach"} variant="cyan" onClick={startVoiceInput} />
          </div>
        </header>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="live-grid">
          {/* Camera feed card */}
          <div
            ref={cardRef}
            style={{
              background: '#000',
              borderRadius: '2rem',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
              position: 'relative',
              overflow: 'hidden',
              height: '480px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            {/* Video & Canvas */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <canvas
              ref={overlayCanvasRef}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            />

            {!sessionActive && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'url(https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5 }}>
                 <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #12080d 0%, transparent 50%, rgba(0,0,0,0.4) 100%)' }} />
              </div>
            )}

            {/* Reps + Posture overlay */}
            <div style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 10 }}>
              <div style={{
                background: 'rgba(42,18,32,0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(212,165,116,0.3)',
                borderRadius: '1.5rem',
                padding: '1.25rem 1.75rem',
                minWidth: '140px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                transition: 'transform 0.2s',
              }}>
                <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#d4a574', display: 'block', marginBottom: '0.25rem' }}>
                  Reps
                </span>
                <span
                  className="heading"
                  id="reps-counter"
                  style={{
                    fontSize: '5rem',
                    lineHeight: 1,
                    color: repFlash ? '#d4a574' : 'white',
                    transform: repFlash ? 'scale(1.15)' : 'scale(1)',
                    display: 'inline-block',
                    transition: 'color 0.2s, transform 0.2s',
                  }}
                >
                  {reps}
                </span>
              </div>

              <div style={{
                background: 'rgba(42,18,32,0.65)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '1rem',
                padding: '1rem 1.25rem',
                maxWidth: '240px',
              }}>
                <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#22d3ee', display: 'block', marginBottom: '0.5rem' }}>
                  Posture
                </span>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontWeight: 500 }}>
                  {postureTip}
                </p>
              </div>
            </div>

            {/* Live badge */}
            <div style={{
              position: 'absolute', bottom: '2rem', right: '2rem', zIndex: 10,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: sessionActive ? '#dc2626' : 'rgba(255,255,255,0.1)',
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.1em',
              textTransform: 'uppercase',
              boxShadow: sessionActive ? '0 0 20px rgba(220,38,38,0.5)' : 'none',
            }}>
              {sessionActive && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }} className="animate-pulse" />}
              {sessionActive ? 'Live Analysis' : 'Camera Off'}
            </div>
          </div>

          {/* Voice Coach Chat */}
          <div style={{
            background: 'rgba(42,18,32,0.4)',
            borderRadius: '2rem',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '2rem',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            height: '480px', // Strict finite boundary
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'rgba(212,165,116,0.05)', borderRadius: '50%', transform: 'translate(40%, -40%)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(212,165,116,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon icon="lucide:mic" style={{ color: '#d4a574', fontSize: '20px' }} />
              </div>
              <h3 className="heading" style={{ fontSize: '1.25rem', letterSpacing: '-0.03em', textTransform: 'uppercase' }}>Live Voice Coach</h3>
            </div>

            {/* Messages */}
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
              {coachMessages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: msg.from === 'user' ? 'rgba(212,165,116,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${msg.from === 'user' ? 'rgba(212,165,116,0.25)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: msg.from === 'user' ? '1.25rem 1.25rem 0 1.25rem' : '1.25rem 1.25rem 1.25rem 0',
                  padding: '0.85rem 1.1rem',
                  fontSize: '0.85rem',
                  color: msg.from === 'user' ? '#d4a574' : 'rgba(255,255,255,0.75)',
                  fontWeight: msg.from === 'user' ? 700 : 500,
                  fontStyle: msg.from === 'coach' ? 'italic' : 'normal',
                  lineHeight: 1.6,
                }}>
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                id="coach-input"
                value={coachInput}
                onChange={e => setCoachInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendCoachMessage()}
                disabled={coachLoading || voiceListening}
                placeholder={voiceListening ? "Listening..." : "Ask coach: Am I doing this right?"}
                style={{
                  flex: 1,
                  background: 'rgba(18,8,13,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '1rem',
                  padding: '1rem 1.25rem',
                  fontSize: '0.8rem',
                  color: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  opacity: (coachLoading || voiceListening) ? 0.5 : 1,
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#d4a574'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button
                id="btn-ask"
                onClick={() => sendCoachMessage()}
                disabled={coachLoading || voiceListening}
                style={{
                  width: '48px', height: '48px',
                  background: '#d4a574',
                  border: 'none',
                  borderRadius: '0.75rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: (coachLoading || voiceListening) ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 8px 20px rgba(212,165,116,0.2)',
                  transition: 'background 0.2s, transform 0.15s',
                  opacity: (coachLoading || voiceListening) ? 0.5 : 1,
                }}
                onMouseOver={e => { if (!(coachLoading || voiceListening)) e.currentTarget.style.background = '#e89b7b' }}
                onMouseOut={e => { if (!(coachLoading || voiceListening)) e.currentTarget.style.background = '#d4a574' }}
              >
                <Icon icon="lucide:send" style={{ fontSize: '18px', color: '#12080d' }} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Wave */}
      <div className="wave-bg" style={{ opacity: 0.15, zIndex: 0 }}>
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#d4a574" />
        </svg>
      </div>

      <DashboardMascot variant="live" />

      <style>{`
        @media (min-width: 1024px) {
          .live-grid { grid-template-columns: 8fr 4fr !important; }
        }
      `}</style>
    </div>
  )
}

function CtaButton({ id, icon, label, primary, variant, onClick }) {
  const base = {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
    padding: '0.875rem 1.5rem', borderRadius: '0.75rem',
    cursor: 'pointer', border: '1px solid transparent',
    transition: 'all 0.2s',
  }
  const styles = primary
    ? { ...base, background: '#d4a574', color: '#12080d', boxShadow: '0 8px 20px rgba(212,165,116,0.25)', borderColor: '#d4a574' }
    : variant === 'danger'
      ? { ...base, background: 'rgba(239,68,68,0.1)', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }
      : variant === 'emerald'
        ? { ...base, background: 'rgba(16,185,129,0.1)', color: '#34d399', borderColor: 'rgba(16,185,129,0.3)' }
        : { ...base, background: 'rgba(6,182,212,0.1)', color: '#22d3ee', borderColor: 'rgba(6,182,212,0.3)' }

  return (
    <button id={id} onClick={onClick} style={styles}
      onMouseOver={e => {
        if (primary) { e.currentTarget.style.background = '#e89b7b'; return }
        if (variant === 'danger') e.currentTarget.style.background = 'rgb(239,68,68)'
        else if (variant === 'emerald') e.currentTarget.style.background = 'rgb(16,185,129)'
        else e.currentTarget.style.background = 'rgb(6,182,212)'
        e.currentTarget.style.color = 'white'
      }}
      onMouseOut={e => {
        if (primary) { e.currentTarget.style.background = '#d4a574'; e.currentTarget.style.color = '#12080d'; return }
        Object.assign(e.currentTarget.style, styles)
      }}
    >
      <Icon icon={icon} style={{ fontSize: '16px' }} />
      {label}
    </button>
  )
}
