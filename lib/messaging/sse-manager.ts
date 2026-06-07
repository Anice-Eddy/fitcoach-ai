type SSEPayload = {
  type: 'message:new' | 'message:read'
  chatId: string
  messageId?: string
}

type SSEClient = ReadableStreamDefaultController<Uint8Array>

const encoder = new TextEncoder()
const clients = new Map<string, Set<SSEClient>>()

function encodeEvent(payload: SSEPayload | { type: 'connected' | 'heartbeat' }) {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
}

/** Registers one active SSE connection for a user and returns a cleanup function. */
export function subscribeToUserEvents(userId: string, controller: SSEClient) {
  const userClients = clients.get(userId) ?? new Set<SSEClient>()
  userClients.add(controller)
  clients.set(userId, userClients)
  controller.enqueue(encodeEvent({ type: 'connected' }))

  return () => {
    userClients.delete(controller)
    if (userClients.size === 0) clients.delete(userId)
  }
}

export function sendHeartbeat(userId: string) {
  const userClients = clients.get(userId)
  if (!userClients) return
  for (const controller of userClients) controller.enqueue(encodeEvent({ type: 'heartbeat' }))
}

export function emitToUser(userId: string, payload: SSEPayload) {
  const userClients = clients.get(userId)
  if (!userClients) return
  for (const controller of userClients) controller.enqueue(encodeEvent(payload))
}
