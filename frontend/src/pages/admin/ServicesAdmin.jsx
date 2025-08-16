import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ServiceForm from '../../components/admin/ServiceForm.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { useToast } from '../../components/ui/Toast.jsx'

export default function ServicesAdmin(){
  const qc = useQueryClient()
  const { push } = useToast() || { push: ()=>{} }
  const { data, isLoading, error } = useQuery({ queryKey:['services-admin'], queryFn:()=>api.get('/services').then(r=>r.data) })
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [q, setQ] = useState('')

  const list = useMemo(()=>{
    const items = data||[]
    return items.filter(s=> !q || s.name?.toLowerCase().includes(q.toLowerCase()) || s.description?.toLowerCase().includes(q.toLowerCase()))
  }, [data, q])

  const save = useMutation({
    mutationFn: async ({ payload, file }) => {
      if (edit && edit._id) {
        if (file) {
          const form = new FormData()
          Object.entries(payload).forEach(([k,v])=> form.append(k, v))
          form.append('image', file)
          return (await api.put(`/services/${edit._id}`, form, { headers:{ 'Content-Type':'multipart/form-data' } })).data
        }
        return (await api.put(`/services/${edit._id}`, payload)).data
      } else {
        if (file) {
          const form = new FormData()
          Object.entries(payload).forEach(([k,v])=> form.append(k, v))
          form.append('image', file)
          return (await api.post('/services', form, { headers:{ 'Content-Type':'multipart/form-data' } })).data
        }
        return (await api.post('/services', payload)).data
      }
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['services-admin']}); setOpen(false); setEdit(null); push('Service saved','success') },
    onError: () => push('Failed to save service','error')
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/services/${id}`).then(r=>r.data),
    onSuccess: () => { qc.invalidateQueries({queryKey:['services-admin']}); push('Service deleted','success') },
    onError: () => push('Failed to delete service','error')
  })

  const toggleActive = useMutation({
    mutationFn: ({id, active}) => api.patch(`/services/${id}`, { active }).then(r=>r.data),
    onSuccess: () => { qc.invalidateQueries({queryKey:['services-admin']}); push('Status updated','success') },
    onError: () => push('Failed to update status','error')
  })

  function openCreate(){ setEdit(null); setOpen(true) }
  function openEdit(s){ setEdit(s); setOpen(true) }
  function onSubmit(payload, file){ save.mutate({ payload, file }) }

  if (isLoading) return <div className="container"><p>Loading…</p></div>
  if (error) return <div className="container"><p>Failed: {error.message}</p></div>

  return (
    <section className="container">
      <div className="row" style={{justifyContent:'space-between'}}>
        <h2>Manage services</h2>
        <div className="row" style={{gap:8}}>
          <Input placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} style={{maxWidth:240}} />
          <Button variant="primary" onClick={openCreate}>New service</Button>
        </div>
      </div>

      <div className="grid" style={{marginTop:16}}>
        {(list||[]).map(s => (
          <div key={s._id} className="card">
            <div className="row" style={{justifyContent:'space-between'}}>
              <div>
                <strong>{s.name}</strong>
                <div className="muted">{s.category} • ${Number(s.price||0).toFixed(2)} • {s.durationMin||60}m</div>
              </div>
              <div className="row" style={{gap:8}}>
                <Button className="btn-sm" onClick={()=>openEdit(s)}>Edit</Button>
                <Button className="btn-sm" onClick={()=>toggleActive.mutate({id:s._id, active: !(s.active!==false) })}>
                  {s.active===false ? 'Activate' : 'Deactivate'}
                </Button>
                <Button className="btn-sm" onClick={()=>remove.mutate(s._id)}>Delete</Button>
              </div>
            </div>
            <p className="muted" style={{marginTop:6}}>{s.description}</p>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title={edit ? 'Edit service' : 'New service'} width={680}>
        <ServiceForm initial={edit||{}} onSubmit={onSubmit} pending={save.isPending} />
      </Modal>
    </section>
  )
}
