import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 10;

export default function ProvidersAdmin() {
  const qc = useQueryClient();
  const { push } = useToast() || { push: () => {} };

  const [status, setStatus] = useState('pending'); // default view
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');

  // --- Data: list providers (admin-scoped)
  const { data, isLoading, error } = useQuery({
    queryKey: ['providers', { status, page, q }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (q) params.set('q', q);
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      // Admin endpoint (keeps parity with ProviderDetail route)
      const res = await api.get(`/admin/providers?${params.toString()}`);
      return res.data; // expected: { items, total, page, limit } OR array
    },
    keepPreviousData: true,
  });

  const list = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.items || [];
  }, [data]);

  const total = (() => {
    if (!data) return 0;
    if (Array.isArray(data)) return data.length;
    return Number(data.total || 0);
  })();

  const limit = (() => {
    if (!data) return PAGE_SIZE;
    if (Array.isArray(data)) return PAGE_SIZE;
    return Number(data.limit || PAGE_SIZE);
  })();

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // --- Mutations: approve / reject (admin-scoped)
  const approve = useMutation({
    mutationFn: async (id) =>
      (await api.patch(`/admin/providers/${id}`, { status: 'approved' })).data,
    onMutate: async (id) => {
      // optimistic update
      await qc.cancelQueries({ queryKey: ['providers'] });
      const prev = qc.getQueriesData({ queryKey: ['providers'] });
      qc.setQueriesData({ queryKey: ['providers'] }, (old) => {
        // handle both object and array shapes
        const mutateList = (arr) =>
          arr.map((p) => (p._id === id ? { ...p, status: 'approved' } : p));

        if (!old) return old;
        if (Array.isArray(old)) return mutateList(old);

        // react-query can store various pages; handle common shape
        if (Array.isArray(old?.items)) {
          return { ...old, items: mutateList(old.items) };
        }
        return old;
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      // rollback
      if (ctx?.prev) {
        ctx.prev.forEach(([key, value]) => qc.setQueryData(key, value));
      }
      push({ title: 'Approve failed', variant: 'error' });
    },
    onSuccess: () => {
      push({ title: 'Provider approved' });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
    },
  });

  const reject = useMutation({
    mutationFn: async (id) =>
      (await api.patch(`/admin/providers/${id}`, { status: 'rejected' })).data,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['providers'] });
      const prev = qc.getQueriesData({ queryKey: ['providers'] });
      qc.setQueriesData({ queryKey: ['providers'] }, (old) => {
        const mutateList = (arr) =>
          arr.map((p) => (p._id === id ? { ...p, status: 'rejected' } : p));

        if (!old) return old;
        if (Array.isArray(old)) return mutateList(old);
        if (Array.isArray(old?.items)) {
          return { ...old, items: mutateList(old.items) };
        }
        return old;
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        ctx.prev.forEach(([key, value]) => qc.setQueryData(key, value));
      }
      push({ title: 'Reject failed', variant: 'error' });
    },
    onSuccess: () => {
      push({ title: 'Provider rejected' });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
    },
  });

  return (
    <div className="container">
      <div className="flex items-center justify-between mb-4">
        <h2>Providers</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Search name/phone"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error">
          {error?.message || 'Failed to load providers.'}
        </div>
      )}

      {isLoading ? (
        <div>Loading…</div>
      ) : list.length === 0 ? (
        <div className="muted">No providers found.</div>
      ) : (
        <>
          <div className="table">
            <div className="row head">
              <div>Name</div>
              <div>Phone</div>
              <div>Status</div>
              <div>Rating</div>
              <div>Actions</div>
            </div>

            {list.map((p) => {
              const rating =
                typeof p.rating === 'number'
                  ? p.rating.toFixed(1)
                  : typeof p.ratingsAverage === 'number'
                  ? p.ratingsAverage.toFixed(1)
                  : '-';
              return (
                <div className="row" key={p._id}>
                  <div>
                    <Link to={`/admin/providers/${p._id}`}>
                      {p.name || p.fullName || '-'}
                    </Link>
                  </div>
                  <div>{p.phone || p.mobile || '-'}</div>
                  <div>{p.status || '-'}</div>
                  <div>{rating}</div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => approve.mutate(p._id)}
                      disabled={
                        approve.isPending || p.status === 'approved'
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => reject.mutate(p._id)}
                      disabled={
                        reject.isPending || p.status === 'rejected'
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div>Total: {total}</div>
            <div className="flex gap-2">
              <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </Button>
              <span>
                Page {page} / {totalPages}
              </span>
              <Button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
