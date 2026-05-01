/**
 * useDuelSocket.js
 * Custom hook managing the WebSocket connection to /api/ws/duel2.
 * Token is sent with every message payload (no query-param auth).
 *
 * Returns: { connect, disconnect, send }
 * Incoming messages are routed via `onMessage` callback passed in.
 */
import { useRef, useCallback, useEffect } from 'react'
import { getToken } from '../../api'

function getWsUrl() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}/api/ws/duel2`
}

export function useDuelSocket(onMessage, fallbackToken) {
  const wsRef    = useRef(null)
  const onMsgRef = useRef(onMessage)
  const pingRef  = useRef(null)
  const fallbackTokenRef = useRef(fallbackToken)

  // Keep refs fresh
  useEffect(() => { onMsgRef.current = onMessage }, [onMessage])
  useEffect(() => { fallbackTokenRef.current = fallbackToken }, [fallbackToken])

  const connect = useCallback(() => {
    // Already open
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) return

    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws

    ws.onopen = () => {
      // Keep-alive every 20 s
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 20_000)
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        onMsgRef.current?.(data)
      } catch (err) {
        // ignore parse error
      }
    }

    ws.onerror = () => ws.close()

    ws.onclose = () => {
      clearInterval(pingRef.current)
    }
  }, [])

  const disconnect = useCallback(() => {
    clearInterval(pingRef.current)
    if (wsRef.current) {
      wsRef.current.onclose = null  // prevent double-cleanup
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const send = useCallback((payload) => {
    const token = getToken() || fallbackTokenRef.current
    const msg = token ? { ...payload, token } : payload
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    } else {
      // Queue once after open
      const retry = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(msg))
          clearInterval(retry)
        }
      }, 200)
      // Give up after 5 s
      setTimeout(() => clearInterval(retry), 5000)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => () => disconnect(), [disconnect])

  return { connect, disconnect, send }
}
