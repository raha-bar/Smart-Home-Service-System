import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import ServiceCard from '../components/ServiceCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const PAGE_SIZE = 6

export default function Services(){
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [cat, setCat] = useState(params.get('category') || 'All')
  const [sort, setSort] = useState(params.get('sort') || 'relevance')
  const [page, setPage] = useState(parseInt(params.get('page')||'1',10))

  useEffect(()=>{
    const next = {};
    if(q) next.q=q
    if(cat && cat!=='All') next.category=cat
    if(sort!=='relevance') next.sort=sort
    if(page>1) next.page=String(page)
    setParams(next,{replace:true})
  },[q,cat,sort,page,setParams])

  const { data, isLoading, error } = useQuery({ queryKey:['services'], queryFn:()=>api.get('/services').then(r=>r.data) })

  const categories = useMemo(()=>{
    const set = new Set((data||[]).map(s => s.category || 'Other')); return ['All', ...Array.from(set)]
  },[data])

  const list = useMemo(()=>{
    const items = data || []
    let filtered = items.filter(s=>{
      const matchesQ = !q || (s.name?.toLowerCase().includes(q.toLowerCase()) || s.description?.toLowerCase().includes(q.toLowerCase()))
      const matchesC = cat === 'All' || (s.category || 'Other') === cat
      return matchesQ && matchesC
    })
    if (sort==='price-asc')   filtered = filtered.sort((a,b)=> (a.price||0) - (b.price||0))
    if (sort==='price-desc')  filtered = filtered.sort((a,b)=> (b.price||0) - (a.price||0))
    if (sort==='name-asc')    filtered = filtered.sort((a,b)=> (a.name||'').localeCompare(b.name||''))
    if (sort==='name-desc')   filtered = filtered.sort((a,b)=> (b.name||'').localeCompare(a.name||''))
    return filtered
  },[data,q,cat,sort])

  const totalPages = Math.max(1, Math.ceil((list.length||0) / PAGE_SIZE))
  const pageItems = useMemo(()=>{
    const start = (page-1)*PAGE_SIZE
    return list.slice(start, start + PAGE_SIZE)
  }, [list, page])

  return (
    <section className="container">
      <div className="hero">
        <h1>Book trusted home services</h1>
        <p>Cleaning, electrical, plumbing, appliance repair and more — fast and reliable.</p>
        <div className="search">
          <Input placeholder="Search services (e.g., AC repair, cleaning…)" value={q} onChange={e=>{ setQ(e.target.value); setPage(1) }} />
          <Button onClick={()=>{ setQ(''); setPage(1) }} className="btn-sm">Clear</Button>
          <select className="input" value={sort} onChange={e=>{ setSort(e.target.value); setPage(1) }} style={{maxWidth:220}}>
            <option value="relevance">Sort: Relevance</option>
            <option value="price-asc">Price: Low to high</option>
            <option value="price-desc">Price: High to low</option>
            <option value="name-asc">Name: A → Z</option>
            <option value="name-desc">Name: Z → A</option>
          </select>
        </div>
        <div className="pills">
          {categories.map(c => <div key={c} className={['pill', c===cat?'active':''].join(' ')} onClick={()=>{ setCat(c); setPage(1) }}>{c}</div>)}
        </div>
      </div>

      <div className="grid">
        {isLoading && Array.from({length:6}).map((_,i)=>(<div key={i} className="card"><div className="skeleton" style={{height:18,marginBottom:8}}/><div className="skeleton" style={{height:12,width:'80%',marginBottom:16}}/><div className="skeleton" style={{height:12,width:'60%'}}/></div>))}
        {error && <p className="mono">Failed to load: {error.message}</p>}
        {!isLoading && !error && pageItems.length===0 && (<div className="card"><h3>No services found</h3><p className="muted">Try a different keyword or category.</p></div>)}
        {pageItems.map(s => <ServiceCard key={s._id} service={s} />)}
      </div>

      {totalPages>1 && (
        <div className="row" style={{justifyContent:'center', marginTop:20, gap:8}}>
          <Button className="btn-sm" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>Prev</Button>
          <div className="badge">Page {page} / {totalPages}</div>
          <Button className="btn-sm" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}>Next</Button>
        </div>
      )}
    </section>
  )
}
