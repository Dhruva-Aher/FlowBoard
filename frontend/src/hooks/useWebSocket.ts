import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useBoardStore } from '@/store/boardStore'
import { usePresenceStore } from '@/store/presenceStore'
import type { WSEvent } from '@/types'

// Derive WebSocket base from the current page origin so the connection goes
// through the Vite dev-server proxy (/ws) rather than trying to reach a
// Docker-internal hostname (e.g. ws://api:8000) that the browser can't resolve.
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const WS_BASE = `${wsProtocol}//${window.location.host}`

export function useWorkspaceSocket(workspaceId: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null)
  const accessToken = useAuthStore((s) => s.accessToken)
  const { applyRemoteEvent } = useBoardStore()
  const { setPresence, removePresence } = usePresenceStore()

  const handleMessage = useCallback((raw: string) => {
    try {
      const event: WSEvent = JSON.parse(raw)
      if (event.event === 'presence.update') {
        const p = event.payload as { user_id: string; name: string; active: boolean }
        if (p.active) {
          setPresence(p.user_id, { user_id: p.user_id, name: p.name, active: true })
        } else {
          removePresence(p.user_id)
        }
      } else {
        applyRemoteEvent(event)
      }
    } catch {
      // Ignore malformed messages
    }
  }, [applyRemoteEvent, setPresence, removePresence])

  useEffect(() => {
    if (!workspaceId || !accessToken) return

    const connect = () => {
      const ws = new WebSocket(`${WS_BASE}/ws/workspace/${workspaceId}?token=${accessToken}`)
      wsRef.current = ws

      ws.onopen = () => console.log('[WS] Connected')
      ws.onmessage = (e) => handleMessage(e.data)
      ws.onclose = (e) => {
        if (e.code !== 1000) setTimeout(connect, 3000) // auto-reconnect
      }
    }

    connect()

    // Heartbeat
    const heartbeat = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 20_000)

    return () => {
      clearInterval(heartbeat)
      wsRef.current?.close(1000)
    }
  }, [workspaceId, accessToken, handleMessage])

  return wsRef
}
