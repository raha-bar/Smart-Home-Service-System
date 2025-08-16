
import { useState } from 'react'
export default function StarsInput({ value=0, onChange }){
  const [hover, setHover] = useState(0)
  const v = hover || value
  return (
    <div style={{display:'inline-flex', gap:6, cursor:'pointer'}}>
      {[1,2,3,4,5].map(n => (
        <span key={n}
          onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)}
          onClick={()=>onChange?.(n)} aria-label={`${n} star`}
          style={{fontSize:20, userSelect:'none'}}>
          {v>=n ? '★' : '☆'}
        </span>
      ))}
    </div>
  )
}
