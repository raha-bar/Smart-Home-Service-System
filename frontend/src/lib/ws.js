let socket;

/**
 * Returns a singleton WebSocket connected to your server.
 * Uses VITE_WS_URL (e.g., ws://localhost:5000) and appends /ws?token=...
 */
export function getSocket(token) {
  const base = (import.meta.env.VITE_WS_URL || 'ws://localhost:5000').replace(/\/+$/, '');
  const url = `${base}/ws?token=${encodeURIComponent(token || '')}`;

  // Reuse if already open to the same URL
  if (socket && socket.readyState === WebSocket.OPEN && socket.url === url) return socket;

  // If a different URL or closed socket, create a new one
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    try { socket.close(); } catch {}
  }

  socket = new WebSocket(url);
  return socket;
}
