import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import ServiceCard from '../components/ServiceCard'
import { getFavIds } from '../lib/favorites'

export default function Favorites(){
  const { data, isLoading, error } = useQuery({ queryKey:['services'], queryFn:()=>api.get('/services').then(r=>r.data) })
  const ids = getFavIds()
  const list = useMemo(()=> (data||[]).filter(s => ids.includes(s._id)), [data, ids])

  return (
    <section className="container">
      <h2>Saved services</h2>
      {isLoading && <p>Loading…</p>}
      {error && <p>Failed: {error.message}</p>}
      {!isLoading && list.length===0 && <p className="muted">No saved services yet.</p>}
      <div className="grid">
        {list.map(s => <ServiceCard key={s._id} service={s} />)}
      </div>
    </section>
  )
}
