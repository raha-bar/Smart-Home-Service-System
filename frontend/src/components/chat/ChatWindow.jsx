import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button'; // <-- fixed path (one level up from /chat to /ui)

export default function ChatWindow({ currentUserId, messages, onSend, onTyping }) {
  const [text, setText] = useState('');
  const listRef = useRef(null);

  // auto scroll to bottom
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function submit(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend?.(t);
    setText('');
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 520 }}>
      <div
        ref={listRef}
        style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'grid', gap: 8 }}
      >
        {messages?.map((m) => {
          const mine = String(m.sender?._id || m.userId) === String(currentUserId);
          return (
            <div
              key={m._id || `${m.createdAt}-${m.text}`}
              className={`bubble ${mine ? 'bubble-me' : 'bubble-them'}`}
              style={{
                justifySelf: mine ? 'end' : 'start',
                maxWidth: '80%',
                padding: '8px 12px',
                borderRadius: 12,
                background: mine ? 'var(--c-primary, #3b82f6)' : 'var(--c-muted, #f3f4f6)',
                color: mine ? '#fff' : 'inherit'
              }}
            >
              {!mine && <div className="muted" style={{ fontSize: 12 }}>{m.sender?.name || 'User'}</div>}
              <div>{m.text}</div>
              <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>
                {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={submit} style={{ display: 'flex', gap: 8, padding: 12 }}>
        <input
          className="input"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onInput={onTyping}
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
