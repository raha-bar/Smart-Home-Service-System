import { Link } from 'react-router-dom'
import Badge from './ui/Badge'
import Button from './ui/Button'
import { toggleFav, isFav } from '../lib/favorites'
import { useState, useEffect } from 'react'

export default function ServiceCard({ service }){
  const price = Number(service.price || 0).toFixed(2)
  const category = service.category || 'General'
  const rating = service.rating || 4.6
  const [fav, setFav] = useState(false)

  useEffect(()=>{ setFav(isFav(service._id)) }, [service._id])

  function onFav(){
    const ids = toggleFav(service._id)
    setFav(ids.includes(service._id))
  }

  return (
    <div className="card">
      <div className="row" style={{justifyContent:'space-between'}}>
        <h3 style={{margin:0}}>{service.name}</h3>
        <div className="row" style={{gap:8, alignItems:'center'}}>
          <Badge>{category}</Badge>
          <button className="btn btn-ghost btn-sm" onClick={onFav} aria-label={fav?'Remove from favorites':'Save service'}>
            {fav ? '♥' : '♡'}
          </button>
        </div>
      </div>
      <p className="muted" style={{minHeight:40}}>{service.description}</p>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div className="row" style={{gap:10}}><span className="price">${price}</span><span className="muted">•</span><span>⭐ {rating}</span></div>
        <div className="row" style={{gap:8}}>
          <Button as={Link} to={`/services/${service._id}`} variant="ghost" className="btn-sm">View</Button>
          <Button as={Link} to={`/book/${service._id}`} variant="primary" className="btn-sm">Book</Button>
        </div>
      </div>
    </div>
  )
}
