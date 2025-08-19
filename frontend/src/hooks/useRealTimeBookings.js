// src/hooks/useRealtimeBookings.js
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../lib/ws.js";
import { useAuth } from "../context/AuthContext.jsx";

// normalize different server payload shapes to a single event format
function normalize(evt) {
  if (!evt) return null;

  const type = evt.type || evt.event || "booking:updated";
  const booking =
    evt.booking ||
    evt.data ||
    evt.payload ||
    null;

  const bookingId =
    evt.bookingId ||
    booking?._id ||
    booking?.id ||
    null;

  const status =
    evt.status ||
    booking?.status ||
    null;

  return { type, bookingId, status, raw: evt, booking };
}

/**
 * useRealtimeBookings
 * @param {Object} params
 * @param {string[]=} params.bookingIds - if provided, only process events for these ids
 * @param {Array<unknown[]>=} params.queryKeysToInvalidate - e.g., [['my-bookings']]
 * @param {(normEvt:{type,bookingId,status,booking,raw})=>void=} params.onEvent
 * @param {boolean=} params.subscribeAll - subscribe to all bookings for this user (default true if no bookingIds)
 */
export default function useRealtimeBookings({
  bookingIds = [],
  queryKeysToInvalidate = [],
  onEvent,
  subscribeAll,
} = {}) {
  const { token } = useAuth() || {};
  const qc = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    const s = getSocket(token);
    socketRef.current = s;

    const doSubscribe = () => {
      try {
        if (bookingIds.length > 0) {
          s.send(JSON.stringify({ type: "bookings:subscribe", bookingIds }));
        } else if (subscribeAll !== false) {
          // subscribe to everything relevant for this authenticated user
          s.send(JSON.stringify({ type: "bookings:subscribe" }));
        }
      } catch {}
    };

    if (s.readyState === WebSocket.OPEN) doSubscribe();
    else s.addEventListener("open", doSubscribe, { once: true });

    const handler = (ev) => {
      try {
        const data = JSON.parse(ev.data || "{}");

        // Accept a few common names
        const known =
          data?.type === "booking:updated" ||
          data?.type === "booking:update" ||
          data?.type === "booking:status" ||
          data?.topic === "booking" ||
          data?.channel === "booking";

        if (!known && !data?.booking && !data?.bookingId) return;

        const n = normalize(data);
        if (!n?.bookingId) return;

        // filter by ids if provided
        if (bookingIds.length > 0 && !bookingIds.includes(String(n.bookingId))) return;

        // invalidate queries first (so lists refetch)
        if (queryKeysToInvalidate.length > 0) {
          queryKeysToInvalidate.forEach((key) => {
            qc.invalidateQueries({ queryKey: key });
          });
        }

        // pass to caller
        onEvent?.(n);
      } catch {}
    };

    s.addEventListener("message", handler);
    return () => {
      s.removeEventListener("message", handler);
    };
  }, [token, qc, JSON.stringify(bookingIds), JSON.stringify(queryKeysToInvalidate), onEvent, subscribeAll]);
}
