import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastCtx = createContext(null)

let idSeq = 0
export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])
  const remove = useCallback((id)=> setToasts(t => t.filter(x=>x.id!==id)), [])
  const push = useCallback((message, type='info', timeout=2400)=>{
    const id = ++idSeq
    setToasts(t => [...t, { id, message, type }])
    if (timeout) setTimeout(()=>remove(id), timeout)
  }, [remove])
  return (
    <ToastCtx.Provider value={{ push, remove }}>
      {children}
      <div style={{ position:'fixed', right:16, bottom:16, display:'grid', gap:8, zIndex:9999 }}>
        {toasts.map(t => (
          <div key={t.id}
            style={{padding:'10px 12px', border:'1px solid #253048', borderRadius:10,
                    background: t.type==='success' ? '#11351f' : t.type==='error' ? '#3a1111' : '#141a29',
                    color:'#e8f0ff', minWidth:220, boxShadow:'0 10px 18px rgba(0,0,0,.25)'}}
            role="status" aria-live="polite">
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export function useToast(){ return useContext(ToastCtx) }
