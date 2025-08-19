import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, width = 520 }) {
  useEffect(() => {
    function onEsc(e) { if (e.key === 'Escape') onClose?.(); }
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.60)', // darker for clarity
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%',
          maxWidth: width,
          background: 'var(--surface, #10131a)',
          color: 'var(--text, #e6e8ee)',
          border: '1px solid var(--card-border, #21283a)',
          borderRadius: 14,
          boxShadow: 'var(--shadow, 0 10px 30px rgba(0,0,0,.25))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border, #1f2430)' }}>
            <strong>{title}</strong>
          </div>
        ) : null}
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}
