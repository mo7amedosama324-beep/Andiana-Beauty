import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export default function SiteHeader({ isAr, setLang, t, authUser, onLogout, cartCount = 0, nudePalette, onTogglePalette }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [badgePulse, setBadgePulse] = useState(false)
  const prevCount = useRef(cartCount)

  useEffect(() => {
    if (cartCount > prevCount.current) {
      setBadgePulse(true)
      const timer = window.setTimeout(() => setBadgePulse(false), 320)
      prevCount.current = cartCount
      return () => window.clearTimeout(timer)
    }
    prevCount.current = cartCount
    return undefined
  }, [cartCount])

  const navLinks = (
    <>
      <Link className="block py-2 transition-all duration-300 ease-out hover:text-stone-900 hover:underline hover:underline-offset-4 dark:hover:text-stone-100" to="/" onClick={() => setMobileMenuOpen(false)}>
        {t.nav.home}
      </Link>
      <Link className="block py-2 transition-all duration-300 ease-out hover:text-stone-900 hover:underline hover:underline-offset-4 dark:hover:text-stone-100" to="/shop" onClick={() => setMobileMenuOpen(false)}>
        {t.nav.shop}
      </Link>
      <Link className="block py-2 transition-all duration-300 ease-out hover:text-stone-900 hover:underline hover:underline-offset-4 dark:hover:text-stone-100" to="/about" onClick={() => setMobileMenuOpen(false)}>
        {t.nav.about}
      </Link>
      {authUser?.is_staff ? (
        <Link className="block py-2 transition-all duration-300 ease-out hover:text-stone-900 hover:underline hover:underline-offset-4 dark:hover:text-stone-100" to="/admin-dashboard" onClick={() => setMobileMenuOpen(false)}>
          {t.nav.admin}
        </Link>
      ) : null}
    </>
  )

  return (
    <>
      <header className="glass-surface sticky top-4 z-20 flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-brand-100 px-5 py-4 shadow-soft backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <img className="h-14 w-14 rounded-xl object-cover shadow-sm" src="/imgs/WhatsApp Image 2026-06-19 at 4.16.12 PM.jpeg" alt="Andiana Beauty" loading="lazy" />
          <div className="hidden sm:block">
            <p className="font-display text-lg text-stone-900">Andiana</p>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Beauty</p>
          </div>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium text-stone-600 md:flex">
          {navLinks}
        </nav>

        <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
          <Link className="button-surface relative border border-brand-200 bg-white text-stone-700" to="/cart">
            {t.nav.cart}
            {cartCount > 0 ? <span className={`absolute -top-2 min-w-[1.1rem] rounded-full bg-stone-900 px-1 text-center text-[10px] font-bold text-white ltr:-right-2 rtl:-left-2 ${badgePulse ? 'cart-badge-pop' : ''}`}>{cartCount > 99 ? '99+' : cartCount}</span> : null}
          </Link>
          <button className="button-surface border border-brand-200 bg-white text-stone-700" type="button" onClick={onTogglePalette}>{nudePalette ? (isAr ? 'ألوان' : 'Palette') : (isAr ? 'ألوان' : 'Palette')}</button>
          <button className="button-surface border border-brand-200 bg-white text-stone-700" type="button" onClick={() => setLang(isAr ? 'en' : 'ar')}>
            {isAr ? 'English' : 'العربية'}
          </button>
          {authUser ? (
            <div className="flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-2 text-xs shadow-sm">
              <span className="text-stone-600">{t.auth.welcome}, {authUser.username}</span>
              <button className="button-surface border border-brand-200 bg-white px-3 py-1 text-[11px] text-stone-700" type="button" onClick={onLogout}>{t.auth.logout}</button>
            </div>
          ) : (
            <Link className="button-surface border border-brand-200 bg-white text-stone-700" to="/login">{t.auth.signIn}</Link>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 md:hidden">
          <Link className="button-surface relative border border-brand-200 bg-white px-3 py-2 text-stone-700" to="/cart">
            {t.nav.cart}
            {cartCount > 0 ? <span className={`absolute -top-2 min-w-[1.1rem] rounded-full bg-stone-900 px-1 text-center text-[10px] font-bold text-white ltr:-right-2 rtl:-left-2 ${badgePulse ? 'cart-badge-pop' : ''}`}>{cartCount > 99 ? '99+' : cartCount}</span> : null}
          </Link>
          <button className="button-surface border border-brand-200 bg-white px-3 py-2 text-stone-700" type="button" onClick={() => setLang(isAr ? 'en' : 'ar')}>{isAr ? 'EN' : 'AR'}</button>
          <button className="button-surface border border-brand-200 bg-white px-3 py-2 text-stone-700" type="button" onClick={() => setMobileMenuOpen((open) => !open)}>☰</button>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="md:hidden fixed top-24 left-0 right-0 z-10 mx-4 rounded-[1.5rem] border border-brand-100 bg-white/95 p-4 text-sm text-stone-600 shadow-elevated backdrop-blur-sm">
          {navLinks}
          {!authUser && <Link className="block py-2 font-semibold text-stone-900" to="/login" onClick={() => setMobileMenuOpen(false)}>{t.auth.signIn}</Link>}
          {authUser && <button className="w-full py-2 text-left font-semibold text-stone-900" type="button" onClick={() => { onLogout(); setMobileMenuOpen(false) }}>{t.auth.logout}</button>}
        </div>
      ) : null}
    </>
  )
}
