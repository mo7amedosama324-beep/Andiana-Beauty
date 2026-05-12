import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'

function App() {
  const [lang, setLang] = useState('en')
  const isAr = lang === 'ar'
  const [authUser, setAuthUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const apiBase = 'http://localhost:8000/api'

  const fetchProfile = async () => {
    const response = await fetch(`${apiBase}/auth/me/`, {
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error('Unauthorized')
    }
    return response.json()
  }

  const handleLogin = async (payload) => {
    setAuthError('')
    setAuthLoading(true)
    try {
      const response = await fetch(`${apiBase}/auth/token/cookie/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error('Login failed')
      }
      await response.json()
      const profile = await fetchProfile()
      setAuthUser(profile)
      return true
    } catch (error) {
      setAuthError(isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials')
      return false
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    fetch(`${apiBase}/auth/logout/`, { method: 'POST', credentials: 'include' })
    setAuthUser(null)
  }

  useEffect(() => {
    fetchProfile()
      .then((profile) => setAuthUser(profile))
      .catch(() => {
        setAuthUser(null)
      })
  }, [])

  const content = {
    en: {
      nav: {
        shop: 'Shop',
        new: 'New',
        brands: 'Brands',
        sale: 'Sale',
        discover: 'Discover',
        services: 'Services & Events',
        search: 'Search Andiana Beauty',
      },
      hero: {
        chip: 'In store & online | Ends May 16',
        h1: 'Earn 5X points',
        p1: 'on wellness and self-care brands. Excludes UB Marketplace.',
        h2: 'Your K-Beauty destination',
        p2: '70+ iconic brands, including faves you can only find here.',
        h3: 'Discover free gifts',
        p3: 'Shop 100+ gifts with purchase. See details.',
        activate: 'Activate',
        shopNow: 'Shop now',
      },
      deals: {
        title: 'Deals for you',
        count: '12 items',
        viewAll: 'View all',
        sale: 'Sale',
        add: 'Add to bag',
      },
      auth: {
        signIn: 'Sign in',
        welcome: 'Welcome',
        logout: 'Logout',
        back: 'Back to store',
      },
    },
    ar: {
      nav: {
        shop: 'تسوق',
        new: 'جديد',
        brands: 'علامات',
        sale: 'تخفيضات',
        discover: 'اكتشف',
        services: 'خدمات وفعاليات',
        search: 'ابحث في Andiana Beauty',
      },
      hero: {
        chip: 'في المتجر وأونلاين | ينتهي 16 مايو',
        h1: 'اكسب 5X نقاط',
        p1: 'على منتجات العناية. لا يشمل ماركت بليس.',
        h2: 'وجهتك لعالم K-Beauty',
        p2: 'أكثر من 70 علامة مختارة تجدونها هنا.',
        h3: 'هدايا مجانية مع الشراء',
        p3: 'أكثر من 100 هدية عند الشراء. التفاصيل بالداخل.',
        activate: 'فعلي العرض',
        shopNow: 'تسوق الآن',
      },
      deals: {
        title: 'عروض لك',
        count: '12 منتج',
        viewAll: 'عرض الكل',
        sale: 'تخفيض',
        add: 'أضف للسلة',
      },
      auth: {
        signIn: 'تسجيل الدخول',
        welcome: 'مرحبا',
        logout: 'تسجيل خروج',
        back: 'العودة للمتجر',
      },
    },
  }

  const deals = [
    {
      name: 'Velvet Skin Foundation',
      nameAr: 'فاونديشن ڤيلڤت سكين',
      price: 'EGP 420',
      old: 'EGP 520',
    },
    {
      name: 'Soft Glam Palette',
      nameAr: 'باليت سوفت جلام',
      price: 'EGP 380',
      old: 'EGP 460',
    },
    {
      name: 'Silk Glow Primer',
      nameAr: 'برايمر سيلك جلو',
      price: 'EGP 240',
      old: 'EGP 310',
    },
    {
      name: 'Matte Lip Cloud',
      nameAr: 'مات ليب كلاود',
      price: 'EGP 160',
      old: 'EGP 210',
    },
    {
      name: 'Precision Brow Kit',
      nameAr: 'عدة حواجب بريسيجن',
      price: 'EGP 190',
      old: 'EGP 250',
    },
    {
      name: 'Glow Setting Mist',
      nameAr: 'ميست تثبيت جلو',
      price: 'EGP 210',
      old: 'EGP 270',
    },
    {
      name: 'Rose Blush Duo',
      nameAr: 'روزبلاش ديو',
      price: 'EGP 175',
      old: 'EGP 230',
    },
    {
      name: 'Radiant Concealer',
      nameAr: 'كونسيلر راديانت',
      price: 'EGP 200',
      old: 'EGP 260',
    },
  ]

  const t = content[lang]

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Home
            isAr={isAr}
            setLang={setLang}
            t={t}
            deals={deals}
            authUser={authUser}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/login"
        element={
          authUser ? (
            <Navigate to="/" replace />
          ) : (
            <Login
              isAr={isAr}
              onLogin={handleLogin}
              loading={authLoading}
              error={authError}
              t={t}
            />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

function Home({ isAr, setLang, t, deals, authUser, onLogout }) {
  return (
    <div
      className={`min-h-screen bg-sand-50 text-stone-900 ${
        isAr ? 'font-ar' : 'font-en'
      }`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-10">
        <header className="glass-surface sticky top-4 z-20 flex flex-wrap items-center gap-4 rounded-2xl border border-brand-500/10 px-5 py-3 shadow-soft">
          <div className="flex items-center gap-4">
            <img
              className="h-14 w-14 rounded-xl object-contain shadow-sm"
              src="/imgs/image.png"
              alt="Andiana Beauty"
            />
            <div className="hidden sm:block">
              <p className="font-display text-lg text-stone-900">Andiana</p>
              <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
                Beauty
              </p>
            </div>
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium text-stone-600 lg:flex">
            <a className="transition hover:text-stone-900" href="#shop">
              {t.nav.shop}
            </a>
            <a className="transition hover:text-stone-900" href="#new">
              {t.nav.new}
            </a>
            <a className="transition hover:text-stone-900" href="#brands">
              {t.nav.brands}
            </a>
            <a className="transition hover:text-stone-900" href="#sale">
              {t.nav.sale}
            </a>
            <a className="transition hover:text-stone-900" href="#discover">
              {t.nav.discover}
            </a>
            <a className="transition hover:text-stone-900" href="#services">
              {t.nav.services}
            </a>
          </nav>

          <div className="flex flex-1 items-center justify-end gap-3 lg:flex-none">
            <label className="group hidden items-center gap-2 rounded-full border border-brand-500/10 bg-white px-4 py-2 text-xs text-stone-500 shadow-sm sm:flex">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4 stroke-stone-400"
              >
                <path d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                className="w-44 bg-transparent text-xs text-stone-700 outline-none"
                type="search"
                placeholder={t.nav.search}
                aria-label="Search"
              />
            </label>
            <button
              className="rounded-full border border-brand-500/20 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow"
              type="button"
              onClick={() => setLang(isAr ? 'en' : 'ar')}
            >
              {isAr ? 'English' : 'العربية'}
            </button>
            {authUser ? (
              <div className="flex items-center gap-2 rounded-full border border-brand-500/10 bg-white px-3 py-2 text-xs shadow-sm">
                <span className="text-stone-600">
                  {t.auth.welcome}, {authUser.username}
                </span>
                <button
                  className="rounded-full border border-brand-500/20 px-3 py-1 text-[11px] font-semibold text-stone-700 transition hover:-translate-y-0.5 hover:shadow-glow"
                  type="button"
                  onClick={onLogout}
                >
                  {t.auth.logout}
                </button>
              </div>
            ) : (
              <Link
                className="rounded-full border border-brand-500/20 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow"
                to="/login"
              >
                {t.auth.signIn}
              </Link>
            )}
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-3">
          <article className="fade-up group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-100 via-blue-50 to-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-glow">
            <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-stone-500">
              {t.hero.chip}
            </span>
            <h2 className="font-display text-2xl text-stone-900">
              {t.hero.h1}
            </h2>
            <p className="text-sm text-stone-600">{t.hero.p1}</p>
            <div className="mt-auto flex items-center gap-3">
              <button className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow">
                {t.hero.activate}
              </button>
              <a className="text-xs font-semibold text-stone-700" href="#shop">
                {t.hero.shopNow}
              </a>
            </div>
            <div className="absolute bottom-5 end-5 grid gap-3">
              <span className="float-soft h-16 w-12 rounded-2xl bg-white/80 shadow-soft"></span>
              <span className="h-12 w-12 rounded-2xl bg-white/80 shadow-soft"></span>
            </div>
          </article>

          <article className="fade-up group relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-200 via-orange-100 to-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-glow">
            <h2 className="font-display text-2xl text-stone-900">
              {t.hero.h2}
            </h2>
            <p className="text-sm text-stone-600">{t.hero.p2}</p>
            <button className="mt-auto w-fit rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow">
              {t.hero.shopNow}
            </button>
            <div className="absolute bottom-5 end-5 grid gap-3">
              <span className="h-14 w-14 rounded-full bg-white/80 shadow-soft"></span>
              <span className="h-20 w-12 rounded-2xl bg-white/80 shadow-soft"></span>
            </div>
          </article>

          <article className="fade-up group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 via-orange-50 to-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-glow">
            <h2 className="font-display text-2xl text-stone-900">
              {t.hero.h3}
            </h2>
            <p className="text-sm text-stone-600">{t.hero.p3}</p>
            <button className="mt-auto w-fit rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow">
              {t.hero.shopNow}
            </button>
            <div className="absolute bottom-5 end-5 grid gap-3">
              <span className="h-10 w-20 rounded-2xl bg-white/80 shadow-soft"></span>
              <span className="h-16 w-12 rounded-2xl bg-white/80 shadow-soft"></span>
            </div>
          </article>
        </section>

        <section className="space-y-6" id="shop">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl text-stone-900">
                {t.deals.title}
              </h3>
              <p className="text-sm text-stone-500">{t.deals.count}</p>
            </div>
            <a className="text-xs font-semibold text-stone-600" href="#shop">
              {t.deals.viewAll}
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {deals.map((deal, index) => (
              <div
                className="group rounded-2xl bg-gradient-to-br from-brand-500/30 via-amber-200/30 to-rose-200/30 p-[1px]"
                key={`${deal.name}-${index}`}
              >
                <article className="fade-up flex h-full flex-col gap-3 rounded-2xl bg-white/90 p-4 shadow-sm transition group-hover:-translate-y-1 group-hover:bg-white">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-brand-600">
                    <span>{t.deals.sale}</span>
                    <span className="rounded-full bg-sand-100 px-2 py-1 text-[10px] text-stone-500">
                      15%
                    </span>
                  </div>
                  <div className="relative h-32 overflow-hidden rounded-xl bg-gradient-to-br from-sand-100 to-white">
                    <div className="absolute inset-0 transition duration-300 group-hover:scale-105"></div>
                  </div>
                  <p className="text-sm font-semibold text-stone-900">
                    {isAr ? deal.nameAr : deal.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span>{deal.price}</span>
                    <span className="text-xs text-stone-400 line-through">
                      {deal.old}
                    </span>
                  </div>
                  <button className="mt-auto rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-glow">
                    {t.deals.add}
                  </button>
                </article>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Login({ isAr, onLogin, loading, error, t }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    const ok = await onLogin(form)
    if (ok) {
      navigate('/')
    }
  }

  return (
    <div
      className={`min-h-screen ${
        isAr ? 'font-ar' : 'font-en'
      } flex items-center justify-center bg-sand-50 px-6`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="glass-surface w-full max-w-md rounded-3xl border border-brand-500/20 p-8 text-center shadow-soft">
        <img
          className="mx-auto h-20 w-20 rounded-2xl object-contain shadow-sm"
          src="/imgs/image.png"
          alt="Andiana Beauty"
        />
        <h2 className="font-display mt-4 text-2xl text-stone-900">
          {t.auth.signIn}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {isAr ? 'ادخلي حسابك لمتابعة الطلبات.' : 'Access your account to continue.'}
        </p>
        <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
          <input
            className="rounded-2xl border border-brand-500/10 bg-white/90 px-4 py-3 text-sm outline-none focus:border-brand-500/40"
            type="text"
            placeholder={isAr ? 'اسم المستخدم' : 'Username'}
            value={form.username}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, username: event.target.value }))
            }
            required
          />
          <div className="relative">
            <input
              className="w-full rounded-2xl border border-brand-500/10 bg-white/90 px-4 py-3 text-sm outline-none focus:border-brand-500/40"
              type={showPassword ? 'text' : 'password'}
              placeholder={isAr ? 'كلمة المرور' : 'Password'}
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              required
            />
            <button
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full border border-brand-500/20 bg-white px-3 py-1 text-[11px] font-semibold text-stone-600"
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? (isAr ? 'اخفاء' : 'Hide') : isAr ? 'اظهار' : 'Show'}
            </button>
          </div>
          <button
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
            type="submit"
            disabled={loading}
          >
            {loading ? <span className="spinner"></span> : null}
            {loading ? (isAr ? 'جاري الدخول...' : 'Signing in...') : t.auth.signIn}
          </button>
        </form>
        {error ? <span className="mt-3 block text-xs text-red-500">{error}</span> : null}
        <Link className="mt-4 inline-flex text-xs font-semibold text-stone-600" to="/">
          {t.auth.back}
        </Link>
      </div>
    </div>
  )
}
