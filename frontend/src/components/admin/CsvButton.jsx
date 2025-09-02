export default function CsvButton({ filename = 'export.csv', rows = [], columns = [] }) {
  function exportCsv() {
    if (!rows?.length) return;
    const heads = columns.map(c => c.header || c.key);
    const accessors = columns.map(c => c.accessor || ((r) => r?.[c.key]));
    const body = rows.map(r => accessors.map(fn => safeCsv(fn(r))).join(',')).join('\n');
    const csv = heads.join(',') + '\n' + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return (
    <button type="button" className="btn" onClick={exportCsv} disabled={!rows?.length}>
      Export CSV
    </button>
  );
}

function safeCsv(v) {
  if (v == null) return '';
  const s = String(v).replace(/"/g, '""');
  if (/[,"\n]/.test(s)) return `"${s}"`;
  return s;
}
