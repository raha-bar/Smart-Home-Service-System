import Input from '../ui/Input'
import Button from '../ui/Button'
import ImageUploader from './ImageUploader.jsx'
import { useState } from 'react'

export default function ServiceForm({ initial={}, onSubmit, pending }){
  const [file, setFile] = useState(null)
  function submit(e){
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: fd.get('name'),
      description: fd.get('description'),
      category: fd.get('category'),
      price: Number(fd.get('price')||0),
      durationMin: Number(fd.get('durationMin')||60),
      active: fd.get('active') === 'on'
    }
    onSubmit?.(payload, file)
  }
  return (
    <form onSubmit={submit} className="form">
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <label>Name<Input name="name" defaultValue={initial.name||''} required /></label>
        <label>Category
          <select name="category" className="input" defaultValue={initial.category||'Other'} required>
            <option>Cleaning</option><option>Electrical</option><option>Plumbing</option>
            <option>HVAC</option><option>Repair</option><option>Other</option>
          </select>
        </label>
      </div>
      <label>Description<textarea className="input" name="description" rows="4" defaultValue={initial.description||''} required/></label>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <label>Price <Input name="price" type="number" step="0.01" defaultValue={initial.price||0} required/></label>
        <label>Duration (min) <Input name="durationMin" type="number" defaultValue={initial.durationMin||60}/></label>
      </div>
      <label className="row" style={{gap:8, alignItems:'center'}}>
        <input type="checkbox" name="active" defaultChecked={initial.active!==false} />
        <span>Active</span>
      </label>
      <div style={{margin:'8px 0'}}>
        <ImageUploader value={initial.imageUrl} onChange={setFile} />
        <p className="muted" style={{marginTop:6}}>If you pick an image, the form sends <code>multipart/form-data</code> with field <code>image</code>.</p>
      </div>
      <Button variant="primary" disabled={pending}>{pending?'Saving…':'Save'}</Button>
    </form>
  )
}
