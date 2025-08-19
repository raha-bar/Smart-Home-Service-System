import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "../lib/ws";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../lib/api";

function normalizeMessage(raw) {
  const msg = raw?.message ? raw.message : raw;
  return {
    _id: msg?._id || `${Date.now()}`,
    text: msg?.content || msg?.text || "",
    sender: msg?.sender
      ? { _id: msg.sender._id, name: msg.sender.name }
      : undefined,
    createdAt: msg?.createdAt || new Date().toISOString(),
  };
}

export default function useChat(bookingId) {
  const { token, user } = useAuth() || {};
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const wsRef = useRef(null);
  const typingTimer = useRef(null);

  // Load initial history from backend
  useEffect(() => {
    let stop = false;
    (async () => {
      if (!bookingId) return;
      try {
        const res = await api.get(`/messages/${bookingId}`);
        const list = Array.isArray(res.data)
          ? res.data.map(normalizeMessage)
          : [];
        if (!stop) setMessages(list);
      } catch {
        if (!stop) setMessages([]);
      }
    })();
    return () => {
      stop = true;
    };
  }, [bookingId]);

  // Connect to WebSocket
  useEffect(() => {
    if (!bookingId) return;
    const s = getSocket(token);
    wsRef.current = s;

    const subscribe = () => {
      try {
        s.send(JSON.stringify({ type: "booking:subscribe", bookingId }));
      } catch {}
    };

    if (s.readyState === WebSocket.OPEN) subscribe();
    else s.addEventListener("open", subscribe, { once: true });

    const onMessage = (ev) => {
      try {
        const data = JSON.parse(ev.data || "{}");
        if (data.bookingId !== bookingId) return;
        if (data.type === "message:new") {
          setMessages((m) => [...m, normalizeMessage(data.message)]);
        } else if (data.type === "message:typing") {
          setTyping(true);
          if (typingTimer.current) clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setTyping(false), 1500);
        }
      } catch {}
    };

    s.addEventListener("message", onMessage);
    return () => s.removeEventListener("message", onMessage);
  }, [bookingId, token]);

  // Send message: persist via REST + notify via WS
  const send = useCallback(
    async (text) => {
      if (!bookingId || !text?.trim()) return;
      try {
        const receiver = messages.find(
          (m) => m.sender?._id !== user?._id
        )?.sender?._id;
        const res = await api.post("/messages", {
          booking: bookingId,
          content: text.trim(),
          receiver,
        });
        const msg = normalizeMessage(res.data);
        setMessages((m) => [...m, msg]);

        const s = wsRef.current || getSocket(token);
        s.send(JSON.stringify({ type: "message:new", bookingId, message: msg }));
      } catch (err) {
        console.error("Send failed", err);
      }
    },
    [bookingId, messages, token, user?._id]
  );

  const sendTyping = useCallback(() => {
    if (!bookingId) return;
    const s = wsRef.current || getSocket(token);
    s.send(JSON.stringify({ type: "message:typing", bookingId }));
  }, [bookingId, token]);

  return { user, messages, typing, send, sendTyping };
}
