import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import ChatWindow from '../../components/chat/ChatWindow.jsx';
import useChat from '../../hooks/useChat.js';

export default function MessagesAdmin() {
  const [rooms, setRooms] = useState([]);
  const [selected, setSelected] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        // If your backend exposes rooms, use it; otherwise leave empty and rely on manual bookingId entry
        const res = await api.get('/messages/rooms', { params: { limit: 50 } });
        if (Array.isArray(res.data)) setRooms(res.data);
        else if (Array.isArray(res.data?.items)) setRooms(res.data.items);
      } catch {
        // Silent if endpoint not available yet
      }
    })();
  }, []);

  const { messages, send, sendTyping } = useChat(selected);

  return (
    <section className="container">
      <h2>Messages (Admin)</h2>

      <div className="card" style={{ margin: '12px 0', display: 'flex', gap: 8 }}>
        <input
          className="input"
          placeholder="Enter a bookingId to open room"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ maxWidth: 420 }}
        />
        <Button onClick={() => setSelected(selected.trim())}>Open</Button>
      </div>

      {rooms?.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <strong>Recent Rooms</strong>
          <div className="flex" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {rooms.map((r) => (
              <Button key={r.bookingId || r._id} variant="ghost" onClick={() => setSelected(r.bookingId || r._id)}>
                {r.bookingId || r._id}
              </Button>
            ))}
          </div>
        </div>
      )}

      {err && <p className="error mono">{err}</p>}

      {!selected && <p className="muted">Pick or enter a booking room to view messages.</p>}

      {selected && (
        <div style={{ marginTop: 12 }}>
          <ChatWindow currentUserId="admin" messages={messages} onSend={send} onTyping={sendTyping} />
        </div>
      )}
    </section>
  );
}
