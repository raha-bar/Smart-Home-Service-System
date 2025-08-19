// src/components/ui/StatusBadge.jsx
export default function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const { bg, color } = ({
    pending:     { bg: "#e5e7eb", color: "#111827" }, // gray
    confirmed:   { bg: "#dbeafe", color: "#1e3a8a" }, // blue
    on_the_way:  { bg: "#ede9fe", color: "#5b21b6" }, // violet
    completed:   { bg: "#dcfce7", color: "#166534" }, // green
    cancelled:   { bg: "#fee2e2", color: "#991b1b" }, // red
  }[s] || { bg: "#f3f4f6", color: "#111827" });

  const label = s.replace(/_/g, " ") || "unknown";
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 12,
        padding: "2px 8px",
        borderRadius: 999,
        background: bg,
        color,
        textTransform: "capitalize",
      }}
      title={label}
    >
      {label}
    </span>
  );
}
