
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Stars from '../components/ui/Stars'
import StarsInput from '../components/ui/StarsInput.jsx'
import { useState } from 'react'
import { useToast } from '../components/ui/Toast.jsx'

export default function ServiceDetail(){
  const { id } = useParams()
  const qc = useQueryClient()
  const { push } = useToast() || { push: ()=>{} }
  const { data: service, isLoading, error } = useQuery({
    queryKey:['service', id],
    queryFn: () => api.get(`/services/${id}`).then(r=>r.data)
  })

  const { data: reviews } = useQuery({
    queryKey:['reviews', id],
    queryFn: async () => {
      try { return (await api.get(`/services/${id}/reviews`)).data }
      catch { return [] }
    }
  })

  const [rating, setRating] = useState(5)
  const add = useMutation({
    mutationFn: async ({ rating, comment }) => {
      try { return (await api.post(`/services/${id}/reviews`, { rating, comment })).data }
      catch (e) {
        return (await api.post(`/reviews`, { serviceId:id, rating, comment })).data
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:['reviews', id] }); push('Thanks for your review!','success') },
    onError: () => push('Could not submit review','error')
  })

  function onSubmit(e){
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    add.mutate({ rating, comment: fd.get('comment') })
    e.currentTarget.reset()
    setRating(5)
  }

  if (isLoading) return <div className="container"><p>Loading…</p></div>
  if (error) return <div className="container"><p>Failed: {error.message}</p></div>

  const list = Array.isArray(reviews) ? reviews : (reviews?.items || [])
  const avg = list.length ? (list.reduce((s,r)=> s + (r.rating||0), 0) / list.length) : (service?.rating || 0)

  return (
    <section className="container" style={{maxWidth:900}}>
      <div className="card">
        <h2>{service?.name}</h2>
        <p className="muted">{service?.description}</p>
        <div className="row" style={{alignItems:'center', gap:10}}>
          <strong>${Number(service?.price||0).toFixed(2)}</strong>
          <span className="muted">•</span>
          <span><Stars value={avg||0}/> {avg?avg.toFixed(1):'–'}</span>
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <h3>Customer reviews</h3>
        {list.length===0 && <p className="muted">No reviews yet — be the first to leave one.</p>}
        <div style={{display:'grid', gap:12}}>
          {list.map(r => (
            <div key={r._id || r.createdAt} className="card" style={{padding:'10px 12px'}}>
              <div className="row" style={{justifyContent:'space-between'}}>
                <div><Stars value={r.rating||0}/> <span className="muted">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</span></div>
                <div className="muted">{r.user?.name || r.userName || 'Anon'}</div>
              </div>
              <p style={{marginTop:6}}>{r.comment}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <h3>Write a review</h3>
        <form onSubmit={onSubmit} className="form">
          <label>Rating <StarsInput value={rating} onChange={setRating}/></label>
          <label>Comment<textarea className="input" name="comment" rows="3" placeholder="Share your experience…" required /></label>
          <Button variant="primary" disabled={add.isPending}>{add.isPending?'Submitting…':'Submit review'}</Button>
        </form>
      </div>
    </section>
  )
}
