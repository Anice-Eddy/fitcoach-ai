'use client'

import { useEffect } from 'react'

export type SSEMessageEvent = {
  type: 'connected' | 'heartbeat' | 'message:new' | 'message:read'
  chatId?: string
  messageId?: string
}

/** Opens the authenticated message SSE stream and forwards parsed events to the caller. */
export function useSSE(onEvent: (event: SSEMessageEvent) => void) {
  useEffect(() => {
    const source = new EventSource('/api/messages/stream')

    source.onmessage = (event) => {
      try {
        onEvent(JSON.parse(event.data) as SSEMessageEvent)
      } catch {
        // Ignore malformed stream chunks.
      }
    }

    return () => source.close()
  }, [onEvent])
}
