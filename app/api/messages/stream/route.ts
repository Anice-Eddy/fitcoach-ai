export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { auth } from '@/lib/auth/auth'
import { sendHeartbeat, subscribeToUserEvents } from '@/lib/messaging/sse-manager'

/** SSE stream for authenticated users; pushes chat events and keeps the connection alive with heartbeats. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const userId = session.user.id
  let cleanup = () => {}

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const unsubscribe = subscribeToUserEvents(userId, controller)
      const heartbeat = setInterval(() => sendHeartbeat(userId), 30000)

      cleanup = () => {
        clearInterval(heartbeat)
        unsubscribe()
      }
    },
    cancel() {
      // Next calls cancel when the browser closes the EventSource connection.
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
