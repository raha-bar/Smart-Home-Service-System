import { useState } from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import Input from "./Input.jsx";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  askReason = false,
  confirmText = "Confirm",
  cancelText = "Cancel",
  busy = false,
  onConfirm,
  onClose,
}) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div
        className="card"
        style={{
          background: "var(--surface, #10131a)",
          color: "var(--text, #e6e8ee)",
          padding: 20,
          borderRadius: 12,
          maxWidth: 440,
          margin: "0 auto",
          border: "1px solid var(--card-border, #21283a)",
          boxShadow: "var(--shadow, 0 10px 30px rgba(0,0,0,.25))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold" style={{ margin: 0, marginBottom: 6 }}>
          {title}
        </h3>
        {message && (
          <p className="text-sm" style={{ color: "var(--muted, #9aa4b2)", marginTop: 4, marginBottom: 16 }}>
            {message}
          </p>
        )}

        {askReason && (
          <div style={{ marginBottom: 16 }}>
            <label className="block text-sm" style={{ display: "block", marginBottom: 6 }}>
              Reason (optional)
            </label>
            <Input
              placeholder="Why are you cancelling?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}

        <div className="flex" style={{ justifyContent: "flex-end", gap: 8 }}>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {cancelText}
          </Button>
          <Button onClick={() => onConfirm?.({ reason })} disabled={busy} variant="primary">
            {busy ? "Working..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
