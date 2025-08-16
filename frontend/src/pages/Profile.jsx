import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../lib/api'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/Toast.jsx'

export default function Profile(){
  const { user, login } = useAuth()
  const { push } = useToast() || { push: () => {} }

  const { data, isLoading, error } = useQuery({
    queryKey:['me'],
    queryFn: () => api.get('/users/me').then(r=>r.data)
  })

  const save = useMutation({
    mutationFn: (payload) => api.put('/users/me', payload).then(r=>r.data),
    onSuccess: (updated) => {
      if (updated?.user) login({ token: localStorage.getItem('token') || '', user: updated.user })
      push('Profile saved','success')
    },
    onError: () => push('Failed to save profile','error')
  })

  const changePw = useMutation({
    mutationFn: (payload) => api.put('/users/me/password', payload).then(r=>r.data),
    onSuccess: () => push('Password updated','success'),
    onError: () => push('Failed to update password','error')
  })

  function onSave(e){
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: fd.get('name') || '',
      phone: fd.get('phone') || '',
      address: fd.get('address') || ''
    }
    save.mutate(payload)
  }

  function onPw(e){
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    changePw.mutate({ currentPassword: fd.get('current'), newPassword: fd.get('next') })
  }

  if (isLoading) return <div className="card"><p>Loading…</p></div>
  if (error) return <div className="card"><p className="mono">Failed: {error.message}</p></div>

  const me = data?.user || data || {}

  return (
    <section className="container" style={{maxWidth:700}}>
      <div className="card">
        <h2>Profile</h2>
        <form onSubmit={onSave} className="form">
          <label>Name<Input name="name" defaultValue={me.name || user?.name || ''} /></label>
          <label>Phone<Input name="phone" defaultValue={me.phone || ''} /></label>
          <label>Address<Input name="address" defaultValue={me.address || ''} /></label>
          <Button variant="primary" disabled={save.isPending}>{save.isPending?'Saving…':'Save changes'}</Button>
        </form>
      </div>

      <div className="card" style={{marginTop:16}}>
        <h3>Change password</h3>
        <form onSubmit={onPw} className="form">
          <label>Current password<Input name="current" type="password" required /></label>
          <label>New password<Input name="next" type="password" required minLength={6} /></label>
          <Button variant="primary" disabled={changePw.isPending}>{changePw.isPending?'Updating…':'Update password'}</Button>
        </form>
      </div>
    </section>
  )
}
