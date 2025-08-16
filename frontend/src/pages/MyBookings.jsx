import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useState } from 'react'
import Modal from '../components/ui/Modal.jsx'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function MyBookings(){
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey:['my-bookings'],
    queryFn:() => api.get('/bookings/me').then(r=>r.data)
  })

  const cancel = useMutation({
    mutationFn: async (id) => {
      try { return (await api.patch(`/bookings/${id}`, { status:'cancelled' })).data }
      catch { try { return (await api.post(`/bookings/${id}/cancel`)).data } catch { return (await api.delete(`/bookings/${id}`)).data } }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey:['my-bookings'] })
  })

  const reschedule = useMutation({
    mutationFn: async ({ id, scheduledAt }) => {
      try { return (await api.patch(`/bookings/${id}`, { scheduledAt })).data }
      catch { return (await api.post(`/bookings/${id}/reschedule`, { scheduledAt })).data }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey:['my-bookings'] })
  })

  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState(null)

  function openReschedule(b){ setTarget(b); setOpen(true) }
  function doReschedule(e){
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    reschedule.mutate({ id: target._id, scheduledAt: fd.get('when') })
    setOpen(false)
  }

  if (isLoading) return <div className="container"><p>Loading…</p></div>
  if (error) return <div className="container"><p>Failed: {error.message}</p></div>

  const list = Array.isArray(data) ? data : (data?.bookings || [])

  return (
    <section className="container">
      <h2>My bookings</h2>
      <div className="grid">
        {list.map(b => (
          <div key={b._id} className="card">
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <strong>{b.service?.name || 'Service'}</strong>
              <span className="muted">{new Date(b.scheduledAt || b.date).toLocaleString()}</span>
            </div>
            {b.address && <p className="muted" style={{marginTop:6}}>{b.address}</p>}
            <div style={{display:'flex',gap:8,marginTop:10}}>
              <Button className="btn-sm" onClick={()=>openReschedule(b)}>Reschedule</Button>
              <Button className="btn-sm" onClick={()=>cancel.mutate(b._id)}>Cancel</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title={`Reschedule — ${target?.service?.name || ''}`}>
        <form onSubmit={doReschedule} className="form">
          <label>New date & time
            <Input type="datetime-local" name="when" required />
          </label>
          <div style={{display:'flex',gap:8}}>
            <Button variant="primary" type="submit" disabled={reschedule.isPending}>Save</Button>
            <Button onClick={()=>setOpen(false)} type="button">Cancel</Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
