import { useRef, useState } from 'react'

export default function ImageUploader({ value, onChange }){
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  function pick(){ inputRef.current?.click() }
  function onFile(e){
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onChange?.(file)
  }
  return (
    <div>
      {preview || value ? (
        <img src={preview || value} alt="preview" style={{maxWidth:160, borderRadius:10, border:'1px solid #253048'}} />
      ) : (
        <div className="card" style={{width:160,height:100,display:'grid',placeItems:'center'}}>No image</div>
      )}
      <div style={{marginTop:8, display:'flex', gap:8}}>
        <button type="button" className="btn btn-sm" onClick={pick}>Choose image</button>
        {preview && <a className="btn btn-sm" href={preview} target="_blank" rel="noreferrer">View</a>}
      </div>
      <input type="file" accept="image/*" hidden ref={inputRef} onChange={onFile} />
    </div>
  )
}
