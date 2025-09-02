import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import DataTable from '../../components/admin/DataTable.jsx';
import DensityToggle from '../../components/admin/DensityToggle.jsx';
import CsvButton from '../../components/admin/CsvButton.jsx';

export default function MessagesAdmin() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => api.get('/messages').then(r => r.data),
    keepPreviousData: true,
  });

  const messages = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.messages)) return data.messages;
    return [];
  }, [data]);

  const [q, setQ] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [density, setDensity] = useState('comfortable');

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return messages.filter(m => {
      const from = (m.from?.name || m.sender?.name || '').toLowerCase();
      const to   = (m.to?.name || m.recipient?.name || '').toLowerCase();
      const text = (m.text || m.body || m.snippet || '').toLowerCase();
      const unread = Boolean(m.unread || m.isUnread || false);
      const okQ = !qq || from.includes(qq) || to.includes(qq) || text.includes(qq);
      const okU = !onlyUnread || unread;
      return okQ && okU;
    });
  }, [messages, q, onlyUnread]);

  const columns = [
    { key:'createdAt', header:'Date', accessor: r => new Date(r.createdAt || 0), render: r =>
      <span className="muted">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</span>, width: 180
    },
    { key:'from', header:'From', accessor: r => r.from?.name || r.sender?.name || '—' },
    { key:'to', header:'To', accessor: r => r.to?.name || r.recipient?.name || '—' },
    { key:'booking', header:'Booking', accessor: r => r.bookingId || '—', width: 160 },
    { key:'text', header:'Message', accessor: r => r.text || r.body || r.snippet || '—', render: r =>
      <span className="muted">{(r.text || r.body || r.snippet || '—').slice(0, 88)}</span>
    },
    { key:'unread', header:'Unread', accessor: r => r.unread || r.isUnread || false, render: r =>
      <span className="pill">{(r.unread || r.isUnread) ? 'Unread' : 'Read'}</span>, width: 100
    },
  ];

  return (
    <section className="container">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Messages (Admin)</h2>
          <div className="muted">{filtered.length} messages</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input className="input" placeholder="Search from/to/message…" value={q} onChange={e=>setQ(e.target.value)} style={{ minWidth:320 }} />
          <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <input type="checkbox" checked={onlyUnread} onChange={e=>setOnlyUnread(e.target.checked)} />
            <span className="muted">Only unread</span>
          </label>
          <CsvButton filename="messages.csv" rows={filtered} columns={columns} />
          <DensityToggle value={density} onChange={setDensity} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {isLoading && <div className="card">Loading…</div>}
        {error && <div className="card">Failed: {error.message}</div>}
        {!isLoading && !error && (
          <DataTable
            columns={columns}
            rows={filtered}
            density={density}
          />
        )}
      </div>
    </section>
  );
}
