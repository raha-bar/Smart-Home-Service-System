import { useMemo, useState } from 'react';

/**
 * Generic DataTable
 * columns: [{key, header, accessor?(row), render?(row), width, align}]
 * props:
 *  - rows
 *  - density: 'comfortable' | 'compact'
 *  - getRowId?(row) -> string
 *  - onRowClick?(row)
 *  - selectable (unused by admin pages but supported)
 *  - selectedIds, onToggleRow(id, checked), onToggleAll(checked)
 *  - emptyMessage
 */
export default function DataTable({
  columns = [],
  rows = [],
  density = 'comfortable',
  getRowId = (r) => String(r._id || r.id),
  onRowClick,
  selectable = false,
  selectedIds = [],
  onToggleRow,
  onToggleAll,
  emptyMessage = 'No data to display.',
}) {
  const [sort, setSort] = useState({ key: columns[0]?.key, dir: 'asc' });

  const sorted = useMemo(() => {
    const key = sort.key;
    const dir = sort.dir === 'asc' ? 1 : -1;
    const acc = (row) => {
      const col = columns.find(c => c.key === key);
      const fn = col?.accessor || ((r) => r?.[key]);
      return normalize(fn(row));
    };
    return [...rows].sort((a, b) => {
      const aa = acc(a), bb = acc(b);
      if (aa < bb) return -1 * dir;
      if (aa > bb) return  1 * dir;
      return 0;
    });
  }, [rows, sort, columns]);

  const allChecked = useMemo(() => {
    if (!selectable || !sorted.length) return false;
    const ids = new Set(selectedIds || []);
    return sorted.every(r => ids.has(getRowId(r)));
  }, [selectable, sorted, selectedIds, getRowId]);

  const sizeStyle = density === 'compact'
    ? { padding: '8px 10px', fontSize: 13 }
    : { padding: '12px 14px', fontSize: 14 };

  if (!sorted.length) {
    return (
      <div className="card">
        <p className="muted" style={{ margin: 0 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%' }}>
        <thead className="thead">
          <tr>
            {selectable && (
              <th className="th" style={{ width: 36, ...sizeStyle }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => onToggleAll?.(e.target.checked)}
                />
              </th>
            )}
            {columns.map(col => (
              <th
                key={col.key}
                className="th"
                style={{ cursor: 'pointer', width: col.width, textAlign: col.align || 'left', ...sizeStyle }}
                onClick={() => setSort(s => ({ key: col.key, dir: (s.key === col.key && s.dir === 'asc') ? 'desc' : 'asc' }))}
                title="Sort"
              >
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span>{col.header || col.key}</span>
                  {sort.key === col.key && <span className="muted">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tbody">
          {sorted.map(row => {
            const id = getRowId(row);
            const checked = selectable && selectedIds?.includes(id);
            return (
              <tr
                key={id}
                className="tr"
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                onClick={(e) => {
                  if (e.target?.closest('input[type="checkbox"]')) return;
                  onRowClick?.(row);
                }}
              >
                {selectable && (
                  <td className="td" style={{ width: 36, ...sizeStyle }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onToggleRow?.(id, e.target.checked)}
                    />
                  </td>
                )}
                {columns.map(col => {
                  const acc = col.accessor || ((r) => r?.[col.key]);
                  const content = col.render ? col.render(row) : acc(row);
                  return (
                    <td
                      key={col.key}
                      className="td"
                      style={{ textAlign: col.align || 'left', verticalAlign: 'middle', ...sizeStyle }}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function normalize(v) {
  if (v == null) return '';
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return v.toLowerCase();
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'boolean') return v ? 1 : 0;
  return String(v).toLowerCase();
}
