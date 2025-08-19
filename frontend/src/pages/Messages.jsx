import { useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import useChat from '../hooks/useChat';
import ChatWindow from '../components/chat/ChatWindow.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function useBookingIdFromURL() {
  const [sp] = useSearchParams();
  const loc = useLocation();
  // supports /messages?bookingId=... or hash fragments
  return useMemo(() => sp.get('bookingId') || new URLSearchParams(loc.hash?.slice(1)).get('bookingId') || '', [sp, loc]);
}

export default function Messages() {
  const bookingId = useBookingIdFromURL();
  const { user } = useAuth();
  const { messages, typing, send, sendTyping } = useChat(bookingId);

  if (!bookingId) {
    return (
      <section className="container" style={{ maxWidth: 760 }}>
        <h2>Messages</h2>
        <p className="muted">Open a chat from your booking details.</p>
      </section>
    );
  }

  return (
    <section className="container" style={{ maxWidth: 760 }}>
      <h2>Messages</h2>
      <p className="muted">Booking: <strong>{bookingId}</strong> {typing ? '· typing…' : ''}</p>
      <ChatWindow
        currentUserId={user?._id}
        messages={messages}
        onSend={send}
        onTyping={sendTyping}
      />
    </section>
  );
}
