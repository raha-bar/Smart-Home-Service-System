
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Stars from '../../components/ui/Stars'
import { useToast } from '../../components/ui/Toast.jsx'

export default function ReviewsAdmin(){
  const qc = useQueryClient()
  const { push } = useToast() || { push: ()=>{} }

  const { data, isLoading, error } = useQuery({
    queryKey:['admin-reviews'],
    queryFn: async () => {
      try { return (await api.get('/reviews?status=pending')).data }
      catch { return (await api.get('/reviews')).data }
    }
  })

  const approve = useMutation({
    mutationFn: (id) => api.patch(`/reviews/${id}`, { status:'approved' }).then(r=>r.data),
    onSuccess: () => { qc.invalidateQueries({queryKey:['admin-reviews']}); push('Review approved','success') },
    onError: () => push('Failed to approve','error')
  })
  const reject = useMutation({
    mutationFn: (id) => api.patch(`/reviews/${id}`, { status:'rejected' }).then(r=>r.data),
    onSuccess: () => { qc.invalidateQueries({queryKey:['admin-reviews']}); push('Review rejected','success') },
    onError: () => push('Failed to reject','error')
  })
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/reviews/${id}`).then(r=>r.data),
    onSuccess: () => { qc.invalidateQueries({queryKey:['admin-reviews']}); push('Review deleted','success') },
    onError: () => push('Failed to delete','error')
  })

  if (isLoading) return <div className="container"><p>Loading…</p></div>
  if (error) return <div className="container"><p>Failed: {error.message}</p></div>

  const list = Array.isArray(data) ? data : (data?.items || [])

  return (
    <section className="container">
      <h2>Review moderation</h2>
      {list.length===0 && <p className="muted">No reviews to moderate.</p>}
      <div className="grid">
        {list.map(r => (
          <div key={r._id} className="card">
            <div className="row" style={{justifyContent:'space-between'}}>
              <div><strong>{r.service?.name || r.serviceName || 'Service'}</strong> — <Stars value={r.rating||0}/></div>
              <div className="muted">{new Date(r.createdAt || Date.now()).toLocaleString()}</div>
            </div>
            <p style={{marginTop:6}}>{r.comment}</p>
            <div className="row" style={{gap:8}}>
              <Button className="btn-sm" onClick={()=>approve.mutate(r._id)}>Approve</Button>
              <Button className="btn-sm" onClick={()=>reject.mutate(r._id)}>Reject</Button>
              <Button className="btn-sm" onClick={()=>remove.mutate(r._id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
