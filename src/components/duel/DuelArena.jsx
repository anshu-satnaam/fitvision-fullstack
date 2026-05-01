/**
 * DuelArena.jsx
 * Live battle screen. Works for random, friend, and AI modes.
 *
 * socket prop: { send(payload), setHandler(fn) }
 * config prop: { mode, exercise, duration, difficulty }
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '../../AuthContext'
import { profileAPI, getBaseURL } from '../../api'
import AiHumanoid from './AiHumanoid'

function fmtTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RepNum({ reps, flash, accent }) {
  return (
    <span style={{
      fontSize: 'clamp(2.5rem,5vw,3.8rem)',
      fontWeight: 900,
      fontFamily: 'monospace',
      color: flash ? accent : 'white',
      display: 'inline-block',
      transform: flash ? 'scale(1.18)' : 'scale(1)',
      transition: 'color 0.15s, transform 0.15s',
      textShadow: flash ? `0 0 18px ${accent}` : 'none',
      lineHeight: 1,
    }}>
      {reps}
    </span>
  )
}

function PlayerCard({ name, avatarSrc, reps, accuracy, flash, isMe, isBot, botDiff, exercise, isActive, videoRef, canvasRef }) {
  const accent = isBot ? '#22d3ee' : isMe ? '#d4a574' : '#a78bfa'

  return (
    <div style={{
      background: 'rgba(42,18,32,0.55)',
      borderRadius: '2rem',
      padding: '1.5rem 1.25rem',
      border: `1px solid ${accent}33`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      flex: 1,
      boxShadow: isMe ? `0 0 28px ${accent}18` : 'none',
    }}>
      {/* Avatar / Bot / Camera */}
      {isBot ? (
        <AiHumanoid key={reps} difficulty={botDiff} exercise={exercise} isActive={isActive} repCount={reps} />
      ) : isMe ? (
        <div style={{ position: 'relative', width: '100%' }}>
          <div style={{ width: '100%', height: '220px', borderRadius: '1rem', border: `3px solid ${accent}`, overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
          </div>
          <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', background: accent, color: '#12080d', fontSize: '0.65rem', fontWeight: 900, padding: '4px 12px', borderRadius: '0.35rem', zIndex: 10 }}>LIVE</div>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ width: '68px', height: '68px', borderRadius: '50%', border: `3px solid ${accent}`, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Icon icon="lucide:user" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '32px' }} />
            }
          </div>
        </div>
      )}

      {/* Name */}
      <span className="heading" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '-0.01em', color: accent, textAlign: 'center', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>

      {/* Reps */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '0.52rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '0.2rem' }}>Reps</span>
        <RepNum reps={reps} flash={flash} accent={accent} />
      </div>

      {/* Accuracy bar */}
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Accuracy</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 900, color: accent }}>{Math.round(accuracy)}%</span>
        </div>
        <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, accuracy)}%`, height: '100%', background: accent, borderRadius: '9999px', transition: 'width 0.5s ease' }} />
        </div>
      </div>
    </div>
  )
}

// ── Main Arena ────────────────────────────────────────────────────────────────

export default function DuelArena({ config, socket, onFinish }) {
  const { user } = useAuth()
  const myId = String(user?.id || user?.uid || '')
  const [phase, setPhase] = useState('waiting')  // waiting | countdown | active | done
  const phaseRef = useRef('waiting')

  // ── Navigation Guard ──
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (phaseRef.current === 'active' || phaseRef.current === 'countdown') {
        e.preventDefault()
        e.returnValue = 'A battle is in progress! Are you sure you want to surrender?'
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const [cdCount,   setCdCount]  = useState(3)
  const [timeLeft,  setTimeLeft] = useState(config.duration)
  const [myReps,    setMyReps]   = useState(0)
  const [myAcc,     setMyAcc]    = useState(100)
  const [oppReps,   setOppReps]  = useState(0)
  const [oppAcc,    setOppAcc]   = useState(100)
  const [myFlash,   setMyFlash]  = useState(false)
  const [oppFlash,  setOppFlash] = useState(false)
  const [roomId,    setRoomId]   = useState(null)
  const [roomCode,  setRoomCode] = useState(null)
  const [opponent,  setOpponent] = useState(null)
  const [feed,      setFeed]     = useState([])
  const [copied,    setCopied]   = useState(false)

  // Mutable refs for values needed inside callbacks
  const timerRef   = useRef(null)
  const roomIdRef  = useRef(null)
  const myRepsRef  = useRef(0)
  const myAccRef   = useRef(100)
  const oppRepsRef = useRef(0)
  const feedIdRef  = useRef(0)
  const opponentRef = useRef(null)

  // MediaPipe AI Refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const poseRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const frameCounterRef = useRef(0)
  const repStateRef = useRef("up")
  const lastAngleRef = useRef(180)

  function pushFeed(text, type = 'system') {
    setFeed(f => [{ id: feedIdRef.current++, text, type, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }, ...f].slice(0, 14))
  }

  // ── AI MediaPipe Initialization ───────────────────────────────────────────
  useEffect(() => {
    let active = true

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

    const startCamera = async () => {
      const Pose = window.Pose;
      if (!Pose) return;
      const pose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}` })
      pose.setOptions({ modelComplexity: 0, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 })
      
      pose.onResults((results) => {
        if (!active) return
        const landmarks = results?.poseLandmarks || []
        
        // Draw Skeleton
        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext("2d")
          const width = videoRef.current.videoWidth || 640
          const height = videoRef.current.videoHeight || 480
          canvas.width = width
          canvas.height = height
          ctx.clearRect(0, 0, width, height)

          if (landmarks.length >= 33) {
            ctx.strokeStyle = "#d4a574"
            ctx.lineWidth = 4
            for (const [a, b] of POSE_CONNECTIONS) {
              const p1 = landmarks[a]
              const p2 = landmarks[b]
              if (p1 && p2 && (p1.visibility ?? 1) > 0.3 && (p2.visibility ?? 1) > 0.3) {
                ctx.beginPath()
                ctx.moveTo(p1.x * width, p1.y * height)
                ctx.lineTo(p2.x * width, p2.y * height)
                ctx.stroke()
              }
            }
          }
        }

        // Rep Logic — thresholds matched to LiveWorkoutPage
        if (landmarks.length >= 33 && phaseRef.current === 'active') {
          const ex = (config.exercise || 'squats').toLowerCase()
          let currentAngle = 180

          if (ex === 'squats' || ex === 'lunges') {
            const left  = angle(landmarks[23], landmarks[25], landmarks[27])
            const right = angle(landmarks[24], landmarks[26], landmarks[28])
            currentAngle = (left + right) / 2
            if (currentAngle < 100) repStateRef.current = 'down'
            if (currentAngle > 160 && repStateRef.current === 'down') {
              repStateRef.current = 'up'
              myRepsRef.current += 1
              const acc = Math.max(60, 100 - myRepsRef.current * 0.05 + (Math.random() * 3 - 1.5))
              myAccRef.current = Math.round(acc)
              setMyReps(myRepsRef.current)
              setMyAcc(myAccRef.current)
              setMyFlash(true)
              setTimeout(() => setMyFlash(false), 250)
              pushFeed(`✅ Rep ${myRepsRef.current}!`, 'me')
              profileAPI.incrementReps(1).catch(console.error)
              if (config.mode !== 'ai') socket.send({ type: 'rep_update', room_id: roomIdRef.current, reps: myRepsRef.current, accuracy: myAccRef.current })
            }
          } else if (ex === 'pushups' || ex === 'burpees') {
            const left  = angle(landmarks[11], landmarks[13], landmarks[15])
            const right = angle(landmarks[12], landmarks[14], landmarks[16])
            currentAngle = (left + right) / 2
            if (currentAngle < 90) repStateRef.current = 'down'
            if (currentAngle > 160 && repStateRef.current === 'down') {
              repStateRef.current = 'up'
              myRepsRef.current += 1
              const acc = Math.max(60, 100 - myRepsRef.current * 0.05 + (Math.random() * 3 - 1.5))
              myAccRef.current = Math.round(acc)
              setMyReps(myRepsRef.current)
              setMyAcc(myAccRef.current)
              setMyFlash(true)
              setTimeout(() => setMyFlash(false), 250)
              pushFeed(`✅ Rep ${myRepsRef.current}!`, 'me')
              profileAPI.incrementReps(1).catch(console.error)
              if (config.mode !== 'ai') socket.send({ type: 'rep_update', room_id: roomIdRef.current, reps: myRepsRef.current, accuracy: myAccRef.current })
            }
          } else {
            // jumping_jacks
            const left  = angle(landmarks[11], landmarks[13], landmarks[15])
            const right = angle(landmarks[12], landmarks[14], landmarks[16])
            currentAngle = (left + right) / 2
            if (currentAngle < 80) repStateRef.current = 'down'
            if (currentAngle > 150 && repStateRef.current === 'down') {
              repStateRef.current = 'up'
              myRepsRef.current += 1
              const acc = Math.max(60, 100 - myRepsRef.current * 0.05 + (Math.random() * 3 - 1.5))
              myAccRef.current = Math.round(acc)
              setMyReps(myRepsRef.current)
              setMyAcc(myAccRef.current)
              setMyFlash(true)
              setTimeout(() => setMyFlash(false), 250)
              pushFeed(`✅ Rep ${myRepsRef.current}!`, 'me')
              profileAPI.incrementReps(1).catch(console.error)
              if (config.mode !== 'ai') socket.send({ type: 'rep_update', room_id: roomIdRef.current, reps: myRepsRef.current, accuracy: myAccRef.current })
            }
          }
          lastAngleRef.current = currentAngle
        }
      })
      poseRef.current = pose

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false })
        if (!active) return
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        
        // Time-based throttle: send to MediaPipe at most every 100ms
        // Prevents queue buildup that causes lag/freeze
        let lastSendTime = 0
        const frameLoop = () => {
          if (!active || !streamRef.current || !videoRef.current || !poseRef.current) return
          const now = performance.now()
          if (now - lastSendTime >= 100) {
            lastSendTime = now
            poseRef.current.send({ image: videoRef.current }).catch(() => {})
          }
          rafRef.current = requestAnimationFrame(frameLoop)
        }
        rafRef.current = requestAnimationFrame(frameLoop)
      } catch (err) {
        console.error("Camera access failed", err)
      }
    }

    startCamera()

    return () => {
      active = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (poseRef.current) poseRef.current.close()
    }
  }, [config.exercise, socket])

  // ── Rep button / spacebar (Fallback) ──────────────────────────────────────
  const addRep = useCallback(() => {
    if (phaseRef.current !== 'active') return
    myRepsRef.current += 1
    const acc = Math.max(55, 100 - myRepsRef.current * 0.08 + (Math.random() * 4 - 2))
    myAccRef.current = Math.round(acc)
    setMyReps(myRepsRef.current)
    setMyAcc(myAccRef.current)
    setMyFlash(true)
    setTimeout(() => setMyFlash(false), 220)
    pushFeed(`✅ Rep ${myRepsRef.current} logged!`, 'me')
    profileAPI.incrementReps(1).catch(console.error)
    socket.send({ type: 'rep_update', room_id: roomIdRef.current, reps: myRepsRef.current, accuracy: myAccRef.current })
  }, [socket])

  useEffect(() => {
    const h = (e) => {
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
        e.preventDefault()
        addRep()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [addRep])

  // ── Matchmaking Timer ─────────────────────────────────────────────────────
  const [waitTimer, setWaitTimer] = useState(60)
  
  useEffect(() => {
    let t;
    if (phase === 'waiting' && config.mode === 'random') {
      t = setInterval(() => {
        setWaitTimer(v => {
          if (v <= 1) {
            clearInterval(t)
            alert("Sorry, can't find anyone. Please try again after some time.")
            socket.send({ type: 'leave_queue' })
            window.location.reload()
            return 0
          }
          return v - 1
        })
      }, 1000)
    }
    return () => clearInterval(t)
  }, [phase, config.mode, socket])

  // ── AI bot simulation (runs fully client-side, no WebSocket needed) ──
  const aiBotRef = useRef(null)
  const aiTimerRef = useRef(null)

  const startAiBattle = useCallback(() => {
    const AI_SPEEDS = { easy: 10, medium: 18, hard: 28 }
    const AI_ACC    = { easy: 72, medium: 85, hard: 94 }
    const diff = config.difficulty || 'medium'
    const repsPerMin = AI_SPEEDS[diff]
    const accBase    = AI_ACC[diff]
    let botReps = 0
    const tickMs = 2000
    const repsPerTick = repsPerMin / 30

    aiBotRef.current = setInterval(() => {
      botReps += repsPerTick + (Math.random() * 0.8 - 0.4)
      const rounded = Math.round(botReps)
      const acc = accBase + (Math.random() * 4 - 2)
      setOppReps(rounded)
      setOppAcc(Math.round(acc))
      oppRepsRef.current = rounded
      setOppFlash(true)
      setTimeout(() => setOppFlash(false), 220)
    }, tickMs)

    setTimeLeft(config.duration)
    aiTimerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(aiTimerRef.current)
          clearInterval(aiBotRef.current)
          phaseRef.current = 'done'
          setPhase('done')
          onFinish({
            winnerId: myRepsRef.current >= oppRepsRef.current ? myId : 'bot',
            scores: { [myId]: { reps: myRepsRef.current, accuracy: myAccRef.current }, bot: { reps: oppRepsRef.current, accuracy: 85 } },
            myId,
            myReps: myRepsRef.current,
            myAcc:  myAccRef.current,
            opponent: { id: 'bot', username: `AI (${diff})` },
            exercise: config.exercise,
            duration: config.duration,
          })
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [config, myId, onFinish])

  const startAiCountdown = useCallback(() => {
    let count = 3
    setPhase('countdown')
    phaseRef.current = 'countdown'
    setCdCount(3)
    pushFeed('⚡ Get ready!', 'system')
    const cd = setInterval(() => {
      count -= 1
      if (count <= 0) {
        clearInterval(cd)
        setPhase('active')
        phaseRef.current = 'active'
        pushFeed('🔴 BATTLE START! Go go go!', 'system')
        startAiBattle()
      } else {
        setCdCount(count)
      }
    }, 1000)
  }, [startAiBattle])

  // Cleanup AI timers on unmount
  useEffect(() => () => {
    clearInterval(aiBotRef.current)
    clearInterval(aiTimerRef.current)
  }, [])

  // ── Init: for AI mode set ready_check locally; for others use WebSocket ──
  useEffect(() => {
    if (config.mode === 'ai') {
      // Fully local — no WebSocket
      setOpponent({ id: 'bot', username: `AI (${config.difficulty || 'medium'})` })
      opponentRef.current = { id: 'bot', username: `AI (${config.difficulty || 'medium'})` }
      setPhase('ready_check')
      phaseRef.current = 'ready_check'
      pushFeed(`🤖 AI opponent ready! Exercise: ${config.exercise}`, 'system')
      return
    }

    if (config.mode === 'random') {
      socket.send({ type: 'join_queue', exercise: config.exercise, duration: config.duration })
    } else if (config.mode === 'friend') {
      if (config.action === 'join') {
        socket.send({ type: 'join_room', room_code: config.roomCode })
      } else {
        socket.send({ type: 'create_room', exercise: config.exercise, duration: config.duration })
      }
    }

    socket.setHandler((msg) => {
      switch (msg.type) {

        case 'room_ready':
          setRoomId(msg.room_id)
          setRoomCode(msg.room_code)
          roomIdRef.current = msg.room_id
          setOpponent(msg.opponent)
          opponentRef.current = msg.opponent
          pushFeed(`🎮 Opponent: ${msg.opponent?.username || 'Opponent'}`, 'system')
          if (msg.require_ready) {
            setPhase('ready_check')
            phaseRef.current = 'ready_check'
          }
          break

        case 'waiting_for_other':
          setPhase('waiting_ready')
          phaseRef.current = 'waiting_ready'
          break

        case 'room_created':
          setRoomId(msg.room_id)
          setRoomCode(msg.room_code)
          roomIdRef.current = msg.room_id
          pushFeed(`🏠 Room created! Code: ${msg.room_code}`, 'system')
          pushFeed('⏳ Waiting for friend to join…', 'system')
          break

        case 'queued':
          pushFeed(`🔍 Searching… position ${msg.position} in queue`, 'system')
          break

        case 'countdown':
          setPhase('countdown')
          phaseRef.current = 'countdown'
          setCdCount(msg.count)
          break

        case 'battle_start':
          setPhase('active')
          phaseRef.current = 'active'
          setRoomId(msg.room_id)
          roomIdRef.current = msg.room_id
          setTimeLeft(config.duration)
          pushFeed('⚡ BATTLE START! Press SPACE or tap the button!', 'system')

          // Start countdown timer
          clearInterval(timerRef.current)
          timerRef.current = setInterval(() => {
            setTimeLeft(t => {
              if (t <= 1) {
                clearInterval(timerRef.current)
                socket.send({ type: 'finish', room_id: roomIdRef.current })
                return 0
              }
              return t - 1
            })
          }, 1000)
          break

        case 'rep_sync': {
          const scores = msg.scores || {}
          Object.entries(scores).forEach(([uid, s]) => {
            // Any key that isn't "me" / myId is the opponent
            if (uid !== myId && uid !== 'me') {
              const nr = s?.reps ?? 0
              if (nr > oppRepsRef.current) {
                oppRepsRef.current = nr
                setOppReps(nr)
                setOppAcc(Math.round(s?.accuracy ?? 100))
                setOppFlash(true)
                setTimeout(() => setOppFlash(false), 220)
                pushFeed(`🔥 Opponent hit ${nr} reps!`, 'opp')
              }
            }
          })
          break
        }

        case 'bot_update':
          setOppReps(msg.reps ?? 0)
          setOppAcc(Math.round(msg.accuracy ?? 100))
          oppRepsRef.current = msg.reps ?? 0
          setOppFlash(true)
          setTimeout(() => setOppFlash(false), 220)
          break

        case 'battle_end':
          clearInterval(timerRef.current)
          phaseRef.current = 'done'
          setPhase('done')
          onFinish({
            winnerId: msg.winner_id,
            scores:   msg.scores || {},
            myId,
            myReps:   myRepsRef.current,
            myAcc:    myAccRef.current,
            opponent: opponentRef.current,
            exercise: config.exercise,
            duration: config.duration,
          })
          break

        case 'opponent_disconnected':
          pushFeed('⚠️ Opponent disconnected', 'system')
          break

        case 'error':
          pushFeed(`❌ ${msg.message}`, 'system')
          break

        default:
          break
      }
    })
    // Only run once — socketProxy is a stable ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), [])

  // ── Surrender ─────────────────────────────────────────────────────────────
  function surrender() {
    clearInterval(timerRef.current)
    socket.send({ type: 'finish', room_id: roomIdRef.current })
  }

  // ── Copy room code ────────────────────────────────────────────────────────
  function copyCode() {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isBot       = config.mode === 'ai'
  const oppName     = isBot ? `AI (${config.difficulty})` : (opponent?.username || (phase === 'waiting' ? 'Searching…' : 'Opponent'))
  const timerColor  = timeLeft <= 10 ? '#f87171' : timeLeft <= 30 ? '#fbbf24' : '#22d3ee'
  const winning     = myReps > oppReps
  const losing      = oppReps > myReps
  const avatarSrc   = user?.avatar_url
    ? (user.avatar_url.startsWith('/') ? `${getBaseURL()}${user.avatar_url}` : user.avatar_url)
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Me'}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '950px', margin: '0 auto' }}>

      {/* ── Room code card for friend battles waiting ── */}
      {config.mode === 'friend' && roomCode && (phase === 'waiting' || phase === 'ready_check') && (
        <div style={{ background: 'linear-gradient(135deg,rgba(167,139,250,0.15),rgba(167,139,250,0.05))', borderRadius: '1.25rem', padding: '1.25rem 1.5rem', border: '1.5px solid rgba(167,139,250,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(167,139,250,0.7)' }}>Share This Room Code</span>
          <span style={{ fontFamily: 'monospace', fontSize: '2.8rem', fontWeight: 900, letterSpacing: '0.35em', color: '#a78bfa', textShadow: '0 0 24px rgba(167,139,250,0.5)' }}>{roomCode}</span>
          <button onClick={copyCode} style={{ background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(167,139,250,0.12)', border: `1px solid ${copied ? '#10b981' : 'rgba(167,139,250,0.3)'}`, borderRadius: '0.6rem', padding: '0.4rem 1.1rem', color: copied ? '#10b981' : '#a78bfa', fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} style={{ fontSize: '13px' }} />
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>Waiting for your friend to join with this code…</span>
        </div>
      )}

      {/* ── Timer / status bar ── */}
      <div style={{ background: 'rgba(42,18,32,0.5)', borderRadius: '1rem', padding: '0.75rem 1.25rem', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: phase === 'active' ? '#10b981' : phase === 'countdown' ? '#fbbf24' : '#6b7280', animation: phase === 'active' ? 'pulse 1.2s infinite' : 'none' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)' }}>
              {config.exercise} · {phase === 'waiting' ? (config.mode === 'random' ? `⏳ Searching… (${waitTimer}s)` : '⏳ Waiting for opponent…') : phase === 'ready_check' ? '✅ Ready Check' : phase === 'waiting_ready' ? '⏳ Waiting for other player…' : phase === 'countdown' ? `⚡ Get Ready! ${cdCount}…` : phase === 'active' ? '🔴 Battle Live' : 'Battle Ended'}
            </span>
          </div>

          {/* Big timer */}
          <span style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 900, color: timerColor, minWidth: '80px', textAlign: 'center' }}>
            {phase === 'countdown' ? cdCount : fmtTime(timeLeft)}
          </span>

          {/* Friend room code */}
          {config.mode === 'friend' && roomCode && (
            <button onClick={copyCode} style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '0.75rem', padding: '0.35rem 0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a78bfa', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.15em' }}>
              <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} style={{ fontSize: '13px' }} />
              {copied ? 'Copied!' : `Code: ${roomCode}`}
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ width: `${(timeLeft / config.duration) * 100}%`, height: '100%', background: timerColor, borderRadius: '9999px', transition: 'width 1s linear, background 0.3s' }} />
        </div>
      </div>

      {/* ── Player cards + VS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 1fr', gap: '0.75rem', alignItems: 'stretch' }}>
        <PlayerCard
          name={user?.username || 'You'}
          avatarSrc={avatarSrc}
          reps={myReps}
          accuracy={myAcc}
          flash={myFlash}
          isMe
          isBot={false}
          isActive={phase === 'active'}
          videoRef={videoRef}
          canvasRef={canvasRef}
        />

        {/* VS column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#12080d', border: '1px solid rgba(212,165,116,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="heading" style={{ fontSize: '1.1rem', color: '#d4a574' }}>VS</span>
          </div>
          {phase === 'active' && (
            <span style={{ fontSize: '0.48rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: winning ? '#10b981' : losing ? '#f87171' : 'rgba(255,255,255,0.2)' }}>
              {winning ? '⬆ Leading' : losing ? '⬇ Behind' : 'Tied'}
            </span>
          )}
        </div>

        <PlayerCard
          name={oppName}
          avatarSrc={null}
          reps={oppReps}
          accuracy={oppAcc}
          flash={oppFlash}
          isMe={false}
          isBot={isBot}
          botDiff={config.difficulty || 'medium'}
          exercise={config.exercise}
          isActive={phase === 'active'}
        />
      </div>

      {/* ── Controls + Feed ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Rep button or Ready Check button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {phase === 'ready_check' ? (
            <button
              onClick={() => {
                if (config.mode === 'ai') {
                  startAiCountdown()
                } else {
                  socket.send({ type: 'player_ready' })
                  setPhase('waiting_ready')
                  phaseRef.current = 'waiting_ready'
                }
              }}
              style={{
                flex: 1, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '1.5rem',
                padding: '2rem 1rem', cursor: 'pointer', color: '#fff', fontWeight: 900, fontSize: '1.1rem',
                textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: '0 10px 30px rgba(16,185,129,0.4)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              🥊 Start Battle!
            </button>
          ) : phase === 'waiting_ready' ? (
            <button
              disabled
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '1.5rem', padding: '2rem 1rem',
                color: 'rgba(255,255,255,0.2)', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em',
              }}
            >
              Waiting for other player...
            </button>
          ) : (
            <button
              id="btn-log-rep"
              onClick={addRep}
              disabled={phase !== 'active'}
              style={{
                flex: 1,
                background: phase === 'active' ? 'linear-gradient(135deg,#d4a574,#e89b7b)' : 'rgba(255,255,255,0.05)',
                border: 'none', borderRadius: '1.5rem', padding: '2rem 1rem',
                cursor: phase === 'active' ? 'pointer' : 'not-allowed',
                color: phase === 'active' ? '#12080d' : 'rgba(255,255,255,0.2)',
                fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                boxShadow: phase === 'active' ? '0 10px 30px rgba(212,165,116,0.3)' : 'none',
              }}
              onMouseDown={e => { if (phase === 'active') e.currentTarget.style.transform = 'scale(0.94)' }}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Icon icon="lucide:check-circle-2" style={{ fontSize: '26px' }} />
              <span>
                Rep Done!<br />
                <span style={{ fontSize: '0.55rem', opacity: 0.6, fontWeight: 700 }}>SPACE / ENTER / TAP</span>
              </span>
            </button>
          )}

          <button
            id="btn-surrender"
            onClick={surrender}
            style={{
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
              borderRadius: '0.875rem', padding: '0.75rem', cursor: 'pointer',
              color: '#f87171', fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase',
              letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)' }}
          >
            <Icon icon="lucide:flag" style={{ fontSize: '14px' }} /> Surrender
          </button>
        </div>

        {/* Battle feed */}
        <div style={{ background: 'rgba(42,18,32,0.4)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', padding: '1.1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <p style={{ fontSize: '0.52rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>⚔️ Battle Feed</p>
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {feed.length === 0 && <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>Starting soon…</p>}
            {feed.map(f => (
              <div key={f.id} style={{ display: 'flex', gap: '0.5rem', animation: 'feedIn 0.25s ease-out', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.2)', flexShrink: 0, marginTop: '1px' }}>{f.ts}</span>
                <span style={{ fontSize: '0.65rem', lineHeight: 1.5, color: f.type === 'me' ? '#d4a574' : f.type === 'opp' ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes feedIn { from { opacity:0; transform:translateY(-5px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @media (max-width:580px) {
          .duel-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
