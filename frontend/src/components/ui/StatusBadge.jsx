export default function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();

  // color map (dark + green theme)
  const map = {
    pending:    { bg:'rgba(148,163,184,.12)', bd:'rgba(148,163,184,.35)', fg:'#dbe3ed', label:'Pending' },
    confirmed:  { bg:'rgba(96,165,250,.12)', bd:'rgba(96,165,250,.35)', fg:'#d6e7ff', label:'Confirmed' },
    'in-progress': { bg:'rgba(59,130,246,.14)', bd:'rgba(59,130,246,.38)', fg:'#d6e7ff', label:'In progress' },
    completed:  { bg:'rgba(34,197,94,.16)', bd:'rgba(34,197,94,.40)', fg:'#d9fbe6', label:'Completed' },
    cancelled:  { bg:'rgba(244,63,94,.14)',  bd:'rgba(244,63,94,.38)',  fg:'#ffd9e0', label:'Cancelled' },
    canceled:   { bg:'rgba(244,63,94,.14)',  bd:'rgba(244,63,94,.38)',  fg:'#ffd9e0', label:'Cancelled' },
    failed:     { bg:'rgba(244,63,94,.14)',  bd:'rgba(244,63,94,.38)',  fg:'#ffd9e0', label:'Failed' },
    default:    { bg:'rgba(148,163,184,.12)', bd:'rgba(148,163,184,.35)', fg:'#dbe3ed', label: status || '—' },
  };

  const { bg, bd, fg, label } = map[s] || map.default;

  return (
    <span
      className="pill"
      title={label}
      style={{
        background:bg,
        border:`1px solid ${bd}`,
        color:fg,
        fontWeight:600
      }}
    >
      {label}
    </span>
  );
}
