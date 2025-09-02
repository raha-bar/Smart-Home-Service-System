export default function DensityToggle({ value = 'comfortable', onChange }) {
  return (
    <div style={{ display: 'inline-flex', gap: 6, border: '1px solid var(--card-border)', borderRadius: 10, padding: 4 }}>
      <button
        type="button"
        className={`btn btn-sm ${value === 'comfortable' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => onChange?.('comfortable')}
      >
        Comfortable
      </button>
      <button
        type="button"
        className={`btn btn-sm ${value === 'compact' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => onChange?.('compact')}
      >
        Compact
      </button>
    </div>
  );
}
