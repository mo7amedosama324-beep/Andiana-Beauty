import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function LoginPage() {
  const { isAr, t, handleLogin, authLoading, authError } = useApp()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    const ok = await handleLogin(form)
    if (ok) navigate('/')
  }

  return (
    <div className={`min-h-screen bg-sand-50 px-4 py-8 ${isAr ? 'font-arabic' : 'font-body'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <div className="card-surface w-full p-8 text-center">
          <img className="mx-auto h-20 w-20 rounded-2xl object-cover shadow-sm" src="/imgs/image.png" alt="Andiana Beauty" loading="lazy" />
          <h1 className="mt-4 font-display text-3xl text-stone-900">{t.auth.signIn}</h1>
          <p className="mt-2 text-sm text-stone-500">{t.login.subtitle}</p>

          <form className="mt-6 grid gap-4 text-left" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              <span>{t.login.username}</span>
              <input className="input-surface" type="text" value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} required />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              <span>{t.login.password}</span>
              <div className="relative">
                <input className="input-surface w-full pe-20" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} required />
                <button className="button-surface absolute end-2 top-1/2 -translate-y-1/2 border border-brand-200 bg-white px-3 py-1 text-[11px] text-stone-700" type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? t.login.hide : t.login.show}</button>
              </div>
            </label>
            <button className="button-surface bg-stone-900 text-white" type="submit" disabled={authLoading}>
              {authLoading ? t.login.signingIn : t.auth.signIn}
            </button>
          </form>

          {authError ? <p className="mt-4 text-xs text-rose-600">{authError}</p> : null}
          <Link className="mt-5 inline-flex text-xs font-semibold text-stone-600 underline-offset-4 hover:underline" to="/">{t.auth.back}</Link>
        </div>
      </div>
    </div>
  )
}
