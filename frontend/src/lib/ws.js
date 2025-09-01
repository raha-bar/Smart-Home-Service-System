// frontend/src/lib/ws.js
import { io } from "socket.io-client";

let socket;

/**
 * Returns a singleton Socket.IO client connected to your server.
 * Accepts either VITE_WS_URL or VITE_SOCKET_URL (fallback) and connects with auth.
 */
export function getSocket(token) {
  const base = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_SOCKET_URL || "http://localhost:5000").replace(/\/+$/, "");

  if (!socket) {
    socket = io(base, {
      transports: ["websocket"],
      withCredentials: true,
      auth: token ? { token } : {}
    });
  } else if (token) {
    // refresh auth on reconnects
    socket.auth = { token };
    if (!socket.connected) socket.connect();
  }
  return socket;
}
