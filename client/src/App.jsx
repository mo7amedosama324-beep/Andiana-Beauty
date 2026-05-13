import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'

const CART_STORAGE_KEY = 'andiana_cart_id'

function getApiOrigin(apiBase) {
  if (!apiBase) return ''
  try {
    return new URL(apiBase).origin
  } catch {
    return ''
  }
}

function formatPrice(value, isAr) {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return ''
  return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-EG', {
    style: 'currency',
    currency: 'EGP',
  }).format(numeric)
}

function resolveImage(src, apiOrigin) {
  if (!src) return ''
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('/media/') && apiOrigin) return `${apiOrigin}${src}`
  return src
}

export default function App() {
  const [lang, setLang] = useState('en')
  const isAr = lang === 'ar'
  const [authUser, setAuthUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState('')
  const [cart, setCart] = useState(null)
  const [cartBusy, setCartBusy] = useState(false)
const apiBase = 'https://osama324.pythonanywhere.com/api';

  const refreshCart = useCallback(async () => {
    const id = localStorage.getItem(CART_STORAGE_KEY)
    if (!id) {
      setCart(null)
      return
    }
    try {
      const response = await fetch(`${apiBase}/carts/${id}/`)
      if (!response.ok) {
        localStorage.removeItem(CART_STORAGE_KEY)
        setCart(null)
        return
      }
      setCart(await response.json())
    } catch {
      setCart(null)
    }
  }, [apiBase])

  const ensureCart = useCallback(async () => {
    let id = localStorage.getItem(CART_STORAGE_KEY)
    if (id) {
      const response = await fetch(`${apiBase}/carts/${id}/`)
      if (response.ok) {
        const data = await response.json()
        setCart(data)
        return data
      }
      localStorage.removeItem(CART_STORAGE_KEY)
    }
    const response = await fetch(`${apiBase}/carts/`, { method: 'POST' })
    if (!response.ok) throw new Error('cart')
    const data = await response.json()
    localStorage.setItem(CART_STORAGE_KEY, data.id)
    setCart(data)
    return data
  }, [apiBase])

  const addToCart = async (productId, delta = 1) => {
    setCartBusy(true)
    try {
      const row = await ensureCart()
      const current =
        row.items?.find((line) => line.product?.id === productId)?.quantity || 0
      const quantity = current + delta
      const response = await fetch(`${apiBase}/carts/${row.id}/items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: productId, quantity }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || 'add')
      }
      setCart(await response.json())
    } finally {
      setCartBusy(false)
    }
  }

  const updateCartLineQuantity = async (productId, quantity) => {
    const id = localStorage.getItem(CART_STORAGE_KEY)
    if (!id) return
    setCartBusy(true)
    try {
      const response = await fetch(`${apiBase}/carts/${id}/items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: productId, quantity }),
      })
      if (!response.ok) throw new Error('qty')
      setCart(await response.json())
    } finally {
      setCartBusy(false)
    }
  }

  const removeCartLine = async (itemId) => {
    const id = localStorage.getItem(CART_STORAGE_KEY)
    if (!id) return
    setCartBusy(true)
    try {
      const response = await fetch(`${apiBase}/carts/${id}/items/${itemId}/`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('delete')
      setCart(await response.json())
    } finally {
      setCartBusy(false)
    }
  }

  const checkout = async (payload) => {
    const id = localStorage.getItem(CART_STORAGE_KEY)
    if (!id) throw new Error('no cart')
    const response = await fetch(`${apiBase}/carts/${id}/checkout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(typeof err.detail === 'string' ? err.detail : 'checkout failed')
    }
    const order = await response.json()
    localStorage.removeItem(CART_STORAGE_KEY)
    setCart(null)
    return order
  }

  const fetchProfile = async () => {
    const response = await fetch(`${apiBase}/auth/me/`, { credentials: 'include' })
    if (!response.ok) throw new Error('Unauthorized')
    return response.json()
  }

  const refreshAccessCookie = async () => {
    const response = await fetch(`${apiBase}/auth/token/cookie/refresh/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    return response.ok
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
      if (!response.ok) throw new Error('Login failed')
      await response.json()
      const profile = await fetchProfile()
      setAuthUser(profile)
      return true
    } catch {
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

  const fetchProducts = async () => {
    setProductsLoading(true)
    setProductsError('')
    try {
      const response = await fetch(`${apiBase}/products/`)
      if (!response.ok) throw new Error('Failed to load products')
      const data = await response.json()
      setProducts(Array.isArray(data) ? data : data.results || [])
    } catch {
      setProductsError(isAr ? 'تعذر تحميل المنتجات الآن' : 'Unable to load products right now')
    } finally {
      setProductsLoading(false)
    }
  }

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    setCategoriesError('')
    try {
      const response = await fetch(`${apiBase}/categories/`)
      if (!response.ok) throw new Error('Failed to load categories')
      const data = await response.json()
      setCategories(Array.isArray(data) ? data : data.results || [])
    } catch {
      setCategoriesError(isAr ? 'تعذر تحميل الأقسام الآن' : 'Unable to load categories right now')
    } finally {
      setCategoriesLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const profile = await fetchProfile()
        if (!cancelled) setAuthUser(profile)
      } catch {
        const refreshed = await refreshAccessCookie()
        if (cancelled) return
        if (refreshed) {
          try {
            setAuthUser(await fetchProfile())
          } catch {
            setAuthUser(null)
          }
        } else {
          setAuthUser(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiBase])

  useEffect(() => {
    fetchProducts()
  }, [apiBase])

  useEffect(() => {
    fetchCategories()
  }, [apiBase])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const cartItemCount =
    cart?.items?.reduce((acc, line) => acc + (line.quantity || 0), 0) ?? 0

  const content = {
    en: {
      nav: { home: 'Home', shop: 'Shop', about: 'About us', admin: 'Admin', cart: 'Bag' },
      deals: { add: 'Add to bag' },
      auth: {
        signIn: 'Sign in',
        welcome: 'Welcome',
        logout: 'Logout',
        back: 'Back to store',
      },
      cartPage: {
        title: 'Your bag',
        empty: 'Your bag is empty.',
        shopCta: 'Continue shopping',
        total: 'Total',
        checkoutTitle: 'Checkout',
        name: 'Full name',
        phone: 'Phone',
        address: 'Delivery address',
        placeOrder: 'Place order',
        placing: 'Placing order…',
        thankYou: 'Thank you! Your order was placed.',
        orderId: 'Order #',
        guestNote: 'No account needed — we only need your delivery details.',
        remove: 'Remove',
      },
    },
    ar: {
      nav: { home: 'الرئيسية', shop: 'التسوق', about: 'من نحن', admin: 'لوحة الأدمن', cart: 'السلة' },
      deals: { add: 'أضف للسلة' },
      auth: {
        signIn: 'تسجيل الدخول',
        welcome: 'مرحبا',
        logout: 'تسجيل خروج',
        back: 'العودة للمتجر',
      },
      cartPage: {
        title: 'سلتك',
        empty: 'السلة فارغة.',
        shopCta: 'متابعة التسوق',
        total: 'الإجمالي',
        checkoutTitle: 'إتمام الطلب',
        name: 'الاسم الكامل',
        phone: 'رقم الهاتف',
        address: 'عنوان التوصيل',
        placeOrder: 'تأكيد الطلب',
        placing: 'جاري إرسال الطلب…',
        thankYou: 'شكرًا! تم استلام طلبك.',
        orderId: 'طلب رقم',
        guestNote: 'لا يلزم تسجيل الدخول — نحتاج بيانات التوصيل فقط.',
        remove: 'حذف',
      },
    },
  }

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
            products={products}
            productsLoading={productsLoading}
            productsError={productsError}
            categories={categories}
            categoriesLoading={categoriesLoading}
            categoriesError={categoriesError}
            apiBase={apiBase}
            authUser={authUser}
            onLogout={handleLogout}
            cartItemCount={cartItemCount}
            onAddToCart={addToCart}
            cartBusy={cartBusy}
          />
        }
      />
      <Route
        path="/shop"
        element={
          <ShopPage
            isAr={isAr}
            setLang={setLang}
            t={t}
            products={products}
            productsLoading={productsLoading}
            productsError={productsError}
            categories={categories}
            categoriesLoading={categoriesLoading}
            categoriesError={categoriesError}
            apiBase={apiBase}
            authUser={authUser}
            onLogout={handleLogout}
            cartItemCount={cartItemCount}
            onAddToCart={addToCart}
            cartBusy={cartBusy}
          />
        }
      />
      <Route
        path="/cart"
        element={
          <CartPage
            isAr={isAr}
            setLang={setLang}
            t={t}
            apiBase={apiBase}
            authUser={authUser}
            onLogout={handleLogout}
            cart={cart}
            refreshCart={refreshCart}
            updateCartLineQuantity={updateCartLineQuantity}
            removeCartLine={removeCartLine}
            checkout={checkout}
            cartBusy={cartBusy}
            cartItemCount={cartItemCount}
          />
        }
      />
      <Route
        path="/about"
        element={
          <AboutPage
            isAr={isAr}
            setLang={setLang}
            t={t}
            authUser={authUser}
            onLogout={handleLogout}
            cartItemCount={cartItemCount}
          />
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          authUser?.is_staff ? (
            <AdminDashboard isAr={isAr} t={t} apiBase={apiBase} />
          ) : (
            <Navigate to="/login" replace />
          )
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

function SiteHeader({ isAr, setLang, t, authUser, onLogout, cartCount = 0 }) {
  return (
    <header className="glass-surface sticky top-4 z-20 flex flex-wrap items-center gap-4 rounded-2xl border border-brand-500/10 px-5 py-3 shadow-soft">
      <div className="flex items-center gap-4">
        <img
          className="h-14 w-14 rounded-xl object-contain shadow-sm"
          src="/imgs/image.png"
          alt="Andiana Beauty"
        />
        <div className="hidden sm:block">
          <p className="font-display text-lg text-stone-900">Andiana</p>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Beauty</p>
        </div>
      </div>

      <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium text-stone-600 md:flex">
        <Link className="transition hover:text-stone-900" to="/">
          {t.nav.home}
        </Link>
        <Link className="transition hover:text-stone-900" to="/shop">
          {t.nav.shop}
        </Link>
        <Link className="transition hover:text-stone-900" to="/about">
          {t.nav.about}
        </Link>
        <Link className="relative transition hover:text-stone-900" to="/cart">
          {t.nav.cart}
          {cartCount > 0 ? (
            <span className="absolute -top-2 min-w-[1.1rem] rounded-full bg-stone-900 px-1 text-center text-[10px] font-bold text-white ltr:-right-2 rtl:-left-2">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          ) : null}
        </Link>
        {authUser?.is_staff ? (
          <Link className="transition hover:text-stone-900" to="/admin-dashboard">
            {t.nav.admin}
          </Link>
        ) : null}
      </nav>

      <div className="flex flex-1 items-center justify-end gap-3 md:flex-none">
        <Link
          className="relative rounded-full border border-brand-500/20 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow md:hidden"
          to="/cart"
        >
          {t.nav.cart}
          {cartCount > 0 ? (
            <span className="absolute -top-1 min-w-[1.1rem] rounded-full bg-stone-900 px-1 text-center text-[10px] font-bold text-white ltr:-right-1 rtl:-left-1">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          ) : null}
        </Link>
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
  )
}

function ProductGrid({ products, isAr, apiOrigin, addLabel, onAddToCart, cartBusy }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => {
        const imageSrc = resolveImage(product.image || product.image_url, apiOrigin)
        return (
          <div
            className="group rounded-2xl bg-gradient-to-br from-brand-500/30 via-amber-200/30 to-rose-200/30 p-[1px]"
            key={product.id}
          >
            <article className="fade-up flex h-full flex-col gap-3 rounded-2xl bg-white/90 p-4 shadow-sm transition group-hover:-translate-y-1 group-hover:bg-white">
              <div className="relative h-32 overflow-hidden rounded-xl bg-gradient-to-br from-sand-100 to-white">
                {imageSrc ? (
                  <img
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    src={imageSrc}
                    alt={product.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 transition duration-300 group-hover:scale-105" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">{product.name}</p>
                {product.category_name ? (
                  <p className="text-xs text-stone-500">{product.category_name}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span>{formatPrice(product.sale_price || product.price, isAr)}</span>
                {product.sale_price ? (
                  <span className="text-xs text-stone-400 line-through">
                    {formatPrice(product.price, isAr)}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                disabled={cartBusy || !onAddToCart}
                onClick={() => onAddToCart?.(product.id)}
                className="mt-auto rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addLabel}
              </button>
            </article>
          </div>
        )
      })}
    </div>
  )
}

function Home({
  isAr,
  setLang,
  t,
  products,
  productsLoading,
  productsError,
  categories,
  categoriesLoading,
  categoriesError,
  apiBase,
  authUser,
  onLogout,
  cartItemCount,
  onAddToCart,
  cartBusy,
}) {
  const apiOrigin = getApiOrigin(apiBase)
  const activeProducts = products.filter((p) => p.is_active !== false)
  const featuredProducts = activeProducts.slice(0, 8)

  return (
    <div
      className={`min-h-screen bg-sand-50 text-stone-900 ${isAr ? 'font-ar' : 'font-en'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-10">
        <SiteHeader
          isAr={isAr}
          setLang={setLang}
          t={t}
          authUser={authUser}
          onLogout={onLogout}
          cartCount={cartItemCount}
        />

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <article className="fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-200 via-amber-100 to-white p-8 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              {isAr ? 'تجربة تسوق فاخرة' : 'Luxury shopping'}
            </p>
            <h1 className="mt-3 font-display text-3xl text-stone-900">
              {isAr ? 'جمالك يبدأ من هنا' : 'Your beauty starts here'}
            </h1>
            <p className="mt-3 text-sm text-stone-600">
              {isAr
                ? 'اختاري عطرك المفضل ومنتجات العناية من أفضل الأقسام.'
                : 'Discover signature perfumes and beauty essentials in curated categories.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow"
                to="/shop"
              >
                {isAr ? 'ابدأ التسوق' : 'Shop now'}
              </Link>
              <Link
                className="rounded-full border border-brand-500/30 bg-white px-5 py-2 text-xs font-semibold text-stone-700 shadow-sm"
                to="/about"
              >
                {isAr ? 'من نحن' : 'About us'}
              </Link>
            </div>
            <div className="absolute -bottom-8 -end-8 h-32 w-32 rounded-full bg-white/60 blur-2xl" />
          </article>

          <article className="fade-up rounded-3xl border border-brand-500/15 bg-white/80 p-6 shadow-soft">
            <h2 className="font-display text-xl text-stone-900">
              {isAr ? 'لماذا Andiana؟' : 'Why Andiana?'}
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-stone-600">
              <li>{isAr ? 'توصيل سريع داخل مصر.' : 'Fast delivery across Egypt.'}</li>
              <li>{isAr ? 'منتجات أصلية مختارة بعناية.' : 'Authentic, curated products.'}</li>
              <li>{isAr ? 'دعم مخصص لعملائنا.' : 'Personalized customer support.'}</li>
            </ul>
          </article>
        </section>

        <section className="space-y-5">
          <div>
            <h3 className="font-display text-2xl text-stone-900">
              {isAr ? 'الأقسام' : 'Categories'}
            </h3>
            <p className="text-sm text-stone-500">
              {isAr ? 'الأقسام تُضاف من لوحة الأدمن.' : 'Categories are managed from the admin dashboard.'}
            </p>
          </div>
          {categoriesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="h-20 rounded-2xl bg-white/70 shadow-soft" key={i} />
              ))}
            </div>
          ) : categoriesError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {categoriesError}
            </p>
          ) : categories.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((c) => (
                <div
                  className="rounded-2xl border border-brand-500/10 bg-white/80 px-4 py-4 shadow-soft"
                  key={c.id}
                >
                  <p className="text-sm font-semibold text-stone-900">{c.name}</p>
                  <p className="text-xs text-stone-500">{isAr ? 'قسم رئيسي' : 'Core category'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-brand-500/10 bg-white px-4 py-3 text-sm text-stone-500">
              {isAr ? 'لا توجد أقسام بعد.' : 'No categories yet.'}
            </p>
          )}
        </section>

        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl text-stone-900">
                {isAr ? 'أحدث المنتجات' : 'Latest products'}
              </h3>
              <p className="text-sm text-stone-500">
                {isAr ? 'تمت إضافتها حديثًا.' : 'Freshly added to the store.'}
              </p>
            </div>
            <Link className="text-xs font-semibold text-stone-600" to="/shop">
              {isAr ? 'عرض الكل' : 'View all'}
            </Link>
          </div>
          {productsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  className="rounded-2xl border border-brand-500/10 bg-white/70 p-4 shadow-soft"
                  key={i}
                >
                  <div className="h-24 rounded-2xl bg-sand-100" />
                  <div className="mt-4 h-4 w-3/4 rounded-full bg-sand-100" />
                </div>
              ))}
            </div>
          ) : productsError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {productsError}
            </p>
          ) : featuredProducts.length ? (
            <ProductGrid
              products={featuredProducts}
              isAr={isAr}
              apiOrigin={apiOrigin}
              addLabel={t.deals.add}
              onAddToCart={onAddToCart}
              cartBusy={cartBusy}
            />
          ) : (
            <p className="rounded-2xl border border-brand-500/10 bg-white px-4 py-3 text-sm text-stone-500">
              {isAr ? 'لا توجد منتجات بعد.' : 'No products yet.'}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

function ShopPage({
  isAr,
  setLang,
  t,
  products,
  productsLoading,
  productsError,
  categories,
  categoriesLoading,
  categoriesError,
  apiBase,
  authUser,
  onLogout,
  cartItemCount,
  onAddToCart,
  cartBusy,
}) {
  const apiOrigin = getApiOrigin(apiBase)
  const [activeCategory, setActiveCategory] = useState('all')
  const activeProducts = products.filter((p) => p.is_active !== false)
  const filteredProducts =
    activeCategory === 'all'
      ? activeProducts
      : activeProducts.filter((p) => String(p.category) === String(activeCategory))

  return (
    <div
      className={`min-h-screen bg-sand-50 text-stone-900 ${isAr ? 'font-ar' : 'font-en'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-10">
        <SiteHeader
          isAr={isAr}
          setLang={setLang}
          t={t}
          authUser={authUser}
          onLogout={onLogout}
          cartCount={cartItemCount}
        />

        <section className="space-y-4">
          <div>
            <h1 className="font-display text-3xl text-stone-900">{isAr ? 'التسوق' : 'Shop'}</h1>
            <p className="text-sm text-stone-500">
              {isAr ? 'تصفحي المنتجات حسب القسم.' : 'Browse products by category.'}
            </p>
          </div>
          {categoriesLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="h-8 w-20 rounded-full bg-white/70" key={i} />
              ))}
            </div>
          ) : categoriesError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {categoriesError}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  activeCategory === 'all'
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-brand-500/20 bg-white text-stone-600'
                }`}
                type="button"
                onClick={() => setActiveCategory('all')}
              >
                {isAr ? 'الكل' : 'All'}
              </button>
              {categories.map((c) => (
                <button
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    String(activeCategory) === String(c.id)
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-brand-500/20 bg-white text-stone-600'
                  }`}
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {productsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                className="rounded-2xl border border-brand-500/10 bg-white/70 p-4 shadow-soft"
                key={i}
              >
                <div className="h-24 rounded-2xl bg-sand-100" />
                <div className="mt-4 h-4 w-3/4 rounded-full bg-sand-100" />
              </div>
            ))}
          </div>
        ) : productsError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {productsError}
          </p>
        ) : filteredProducts.length ? (
          <ProductGrid
            products={filteredProducts}
            isAr={isAr}
            apiOrigin={apiOrigin}
            addLabel={t.deals.add}
            onAddToCart={onAddToCart}
            cartBusy={cartBusy}
          />
        ) : (
          <p className="rounded-2xl border border-brand-500/10 bg-white px-4 py-3 text-sm text-stone-500">
            {isAr ? 'لا توجد منتجات في هذا القسم.' : 'No products in this category.'}
          </p>
        )}
      </div>
    </div>
  )
}

function ScrollReveal({ children, className = '', rootMargin = '0px 0px -11% 0px', hero = false }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.06, rootMargin }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin])

  const base = hero ? 'about-reveal-block about-reveal-hero' : 'about-reveal-block'
  return (
    <div
      ref={ref}
      className={`${base}${shown ? ' about-reveal-block--in' : ''}${className ? ` ${className}` : ''}`.trim()}
    >
      {children}
    </div>
  )
}

function AboutPage({ isAr, setLang, t, authUser, onLogout, cartItemCount }) {
  const about = isAr
    ? {
        title: 'من نحن',
        subtitle: 'Andiana Beauty',
        intro:
          'علامة ولدت من الشاشة، وكبرت مع ناس آمنوا إن الجمال يستحق وقتًا واستشارة ولمسة خفيفة—فصار لنا عنوان على الأرض يعبّر عن نفس القيم.',
        s1Eyebrow: 'كيف كبرنا',
        s1Title: 'رقميًا أولًا، ثم بابٌ يُفتح',
        s1Body:
          'انطلقنا من التجارة الإلكترونية؛ مع تزايد الطلب بدا واضحًا إن التجربة تحتاج حضورًا أوضح. أواخر ٢٠٢٠ كانت مرحلة يغلب عليها العمل عن بُعد، ومع بدايات ٢٠٢١ رُفعت الستارة على مساحة نلتقي فيها بنفس الحماس—لنكمّل القصة خارج الصندوق البريدي فقط.',
        s2Eyebrow: 'الجذور',
        s2Title: 'حب الميكب والعناية قبل الاسم',
        s2Body:
          'ما كان الإعلان هو البداية؛ كانت هناك دوائر صغيرة تتحدث ألوانًا وقوامًا وروائح، من شغف حقيقي بالمكياج والعناية بالبشرة. هذا الولع سبق اللافتات، فحين صار للعلامة وجهٌ علني، كان مجرد امتداد طبيعي لشيء عشناه بالفعل.',
        s3Eyebrow: 'اليوم',
        s3Title: 'نكمل معكم، بنفس النبرة',
        s3Body:
          'نختار ما نعرضه بعينٍ حريصة، ونُبقي الحوار قصيرًا ومفيدًا، ونرحّب بالقديم والجديد على السواء: من تابعنا من البداية، ومن يخطو أول مرة عتبة المتجر الإلكتروني أو الفعلي.',
      }
    : {
        title: 'About us',
        subtitle: 'Andiana Beauty',
        intro:
          'A brand that took its first breath online, then deepened with people who believe beauty deserves time, advice, and a gentle human touch—until a real address became the natural continuation of the same promise.',
        s1Eyebrow: 'How we grew',
        s1Title: 'Digital first, then an open door',
        s1Body:
          'We began as an e‑commerce story; as demand grew it became clear the experience needed a clearer presence. Late 2020 leaned heavily on remote service, and in early 2021 we opened a space to match that momentum—a place to continue the conversation beyond the inbox alone.',
        s2Eyebrow: 'The roots',
        s2Title: 'Makeup & skincare before the signboard',
        s2Body:
          'The starting point was not a launch poster—it was small circles trading shades, textures, and scents, driven by a sincere love of makeup and skin. That curiosity lived long before a public name, so when Andiana took shape officially it simply dressed an obsession we already wore every day.',
        s3Eyebrow: 'Now',
        s3Title: 'Same voice, new chapters',
        s3Body:
          'We still curate with a careful eye, keep guidance concise and honest, and greet first‑timers the way we greet long‑time followers—whether you meet us on the site or walk through the door.',
      }

  const imgOnline = '/imgs/photo-1512207576147-99bc3066b621.jpg'
  const imgMakeup = '/imgs/makeup-powder-foundation-brushes.jpg'
  const imgBoutique = '/imgs/istockphoto-1093145614-612x612.jpg'

  return (
    <div
      className={`min-h-screen bg-sand-50 text-stone-900 ${isAr ? 'font-ar' : 'font-en'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <SiteHeader
          isAr={isAr}
          setLang={setLang}
          t={t}
          authUser={authUser}
          onLogout={onLogout}
          cartCount={cartItemCount}
        />

        <div className="mt-10 space-y-16 md:space-y-24">
          <ScrollReveal hero>
            <header className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500/90">
                {about.subtitle}
              </p>
              <h1 className="mt-3 font-display text-4xl text-stone-900 md:text-5xl">
                {about.title}
              </h1>
              <p className="mt-5 text-base leading-relaxed text-stone-600 md:text-lg">
                {about.intro}
              </p>
            </header>
          </ScrollReveal>

          <ScrollReveal>
            <section className="rounded-[2rem] border border-brand-500/10 bg-white/75 p-6 shadow-soft md:p-10 lg:p-12">
              <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
                <div className="about-col order-2 space-y-4 md:order-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
                    {about.s1Eyebrow}
                  </p>
                  <h2 className="font-display text-2xl text-stone-900 md:text-3xl">
                    {about.s1Title}
                  </h2>
                  <p className="text-sm leading-relaxed text-stone-600 md:text-base">
                    {about.s1Body}
                  </p>
                </div>
                <div className="about-col order-1 md:order-2">
                  <div className="about-reveal-frame relative aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-rose-100 to-amber-50 shadow-inner ring-1 ring-stone-900/5">
                    <img
                      src={imgOnline}
                      alt=""
                      className="about-reveal-img h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-900/25 to-transparent" />
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal>
            <section className="rounded-[2rem] border border-brand-500/10 bg-white/75 p-6 shadow-soft md:p-10 lg:p-12">
              <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
                <div className="about-col">
                  <div className="about-reveal-frame relative aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 to-rose-50 shadow-inner ring-1 ring-stone-900/5">
                    <img
                      src={imgMakeup}
                      alt=""
                      className="about-reveal-img h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-900/20 to-transparent" />
                  </div>
                </div>
                <div className="about-col space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
                    {about.s2Eyebrow}
                  </p>
                  <h2 className="font-display text-2xl text-stone-900 md:text-3xl">
                    {about.s2Title}
                  </h2>
                  <p className="text-sm leading-relaxed text-stone-600 md:text-base">
                    {about.s2Body}
                  </p>
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal>
            <section className="rounded-[2rem] border border-brand-500/10 bg-white/75 p-6 shadow-soft md:p-10 lg:p-12">
              <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
                <div className="about-col order-2 space-y-4 md:order-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
                    {about.s3Eyebrow}
                  </p>
                  <h2 className="font-display text-2xl text-stone-900 md:text-3xl">
                    {about.s3Title}
                  </h2>
                  <p className="text-sm leading-relaxed text-stone-600 md:text-base">
                    {about.s3Body}
                  </p>
                </div>
                <div className="about-col order-1 md:order-2">
                  <div className="about-reveal-frame relative aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-sand-100 to-white shadow-inner ring-1 ring-stone-900/5">
                    <img
                      src={imgBoutique}
                      alt=""
                      className="about-reveal-img h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-900/25 to-transparent" />
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}

function CartPage({
  isAr,
  setLang,
  t,
  apiBase,
  authUser,
  onLogout,
  cart,
  refreshCart,
  updateCartLineQuantity,
  removeCartLine,
  checkout,
  cartBusy,
  cartItemCount,
}) {
  const tc = t.cartPage
  const apiOrigin = getApiOrigin(apiBase)
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [doneOrder, setDoneOrder] = useState(null)

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!cart?.items?.length) return
    setSubmitting(true)
    try {
      const order = await checkout({
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_address: form.customer_address.trim(),
      })
      setDoneOrder(order)
      setForm({ customer_name: '', customer_phone: '', customer_address: '' })
    } catch (err) {
      setError(err.message || 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  if (doneOrder) {
    return (
      <div
        className={`min-h-screen bg-sand-50 text-stone-900 ${isAr ? 'font-ar' : 'font-en'}`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 pb-16 pt-10">
          <SiteHeader
            isAr={isAr}
            setLang={setLang}
            t={t}
            authUser={authUser}
            onLogout={onLogout}
            cartCount={0}
          />
          <section className="rounded-3xl border border-brand-500/10 bg-white/90 p-8 text-center shadow-soft">
            <p className="font-display text-xl text-stone-900">{tc.thankYou}</p>
            <p className="mt-2 text-sm text-stone-600">
              {tc.orderId}
              {doneOrder.id}
            </p>
            <Link
              className="mt-6 inline-flex rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow"
              to="/shop"
            >
              {tc.shopCta}
            </Link>
          </section>
        </div>
      </div>
    )
  }

  const lines = cart?.items ?? []
  const totalLabel =
    cart?.total != null ? formatPrice(cart.total, isAr) : formatPrice(0, isAr)

  return (
    <div
      className={`min-h-screen bg-sand-50 text-stone-900 ${isAr ? 'font-ar' : 'font-en'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 pb-16 pt-10">
        <SiteHeader
          isAr={isAr}
          setLang={setLang}
          t={t}
          authUser={authUser}
          onLogout={onLogout}
          cartCount={cartItemCount}
        />
        <div>
          <h1 className="font-display text-3xl text-stone-900">{tc.title}</h1>
          <p className="mt-1 text-sm text-stone-500">{tc.guestNote}</p>
        </div>
        {!lines.length ? (
          <div className="rounded-3xl border border-brand-500/10 bg-white/80 p-8 text-center shadow-soft">
            <p className="text-stone-600">{tc.empty}</p>
            <Link
              className="mt-4 inline-flex rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow"
              to="/shop"
            >
              {tc.shopCta}
            </Link>
          </div>
        ) : (
          <div className="grid gap-8">
            <section className="space-y-4 rounded-3xl border border-brand-500/10 bg-white/80 p-6 shadow-soft">
              {lines.map((line) => {
                const img = resolveImage(
                  line.product?.image || line.product?.image_url,
                  apiOrigin
                )
                const pid = line.product?.id
                return (
                  <div
                    key={line.id}
                    className="flex flex-wrap items-center gap-4 border-b border-brand-500/10 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand-100">
                      {img ? (
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-900">{line.product?.name}</p>
                      <p className="text-xs text-stone-500">
                        {formatPrice(line.unit_price, isAr)} × {line.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={cartBusy || line.quantity <= 1 || !pid}
                        className="rounded-lg border border-brand-500/20 px-2 py-1 text-sm disabled:opacity-40"
                        onClick={() => pid && updateCartLineQuantity(pid, line.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={cartBusy || !pid}
                        className="rounded-lg border border-brand-500/20 px-2 py-1 text-sm disabled:opacity-40"
                        onClick={() => pid && updateCartLineQuantity(pid, line.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        disabled={cartBusy}
                        className="text-xs font-semibold text-red-600"
                        onClick={() => removeCartLine(line.id)}
                      >
                        {tc.remove}
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-stone-900">
                      {formatPrice(line.line_total, isAr)}
                    </p>
                  </div>
                )
              })}
              <div className="flex justify-between border-t border-brand-500/10 pt-4 text-sm font-semibold">
                <span>{tc.total}</span>
                <span>{totalLabel}</span>
              </div>
            </section>
            <section className="rounded-3xl border border-brand-500/10 bg-white/80 p-6 shadow-soft">
              <h2 className="font-display text-lg text-stone-900">{tc.checkoutTitle}</h2>
              <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
                <input
                  required
                  className="rounded-2xl border border-brand-500/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500/40"
                  placeholder={tc.name}
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, customer_name: e.target.value }))
                  }
                />
                <input
                  required
                  className="rounded-2xl border border-brand-500/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500/40"
                  placeholder={tc.phone}
                  value={form.customer_phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, customer_phone: e.target.value }))
                  }
                />
                <textarea
                  required
                  rows={3}
                  className="rounded-2xl border border-brand-500/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500/40"
                  placeholder={tc.address}
                  value={form.customer_address}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, customer_address: e.target.value }))
                  }
                />
                {error ? <p className="text-xs text-red-600">{error}</p> : null}
                <button
                  type="submit"
                  disabled={submitting || cartBusy}
                  className="w-fit rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? tc.placing : tc.placeOrder}
                </button>
              </form>
            </section>
          </div>
        )}
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
    if (ok) navigate('/')
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
        <h2 className="font-display mt-4 text-2xl text-stone-900">{t.auth.signIn}</h2>
        <p className="mt-1 text-sm text-stone-500">
          {isAr ? 'ادخلي حسابك لمتابعة الطلبات.' : 'Access your account to continue.'}
        </p>
        <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
          <input
            className="rounded-2xl border border-brand-500/10 bg-white/90 px-4 py-3 text-sm outline-none focus:border-brand-500/40"
            type="text"
            placeholder={isAr ? 'اسم المستخدم' : 'Username'}
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            required
          />
          <div className="relative">
            <input
              className="w-full rounded-2xl border border-brand-500/10 bg-white/90 px-4 py-3 text-sm outline-none focus:border-brand-500/40"
              type={showPassword ? 'text' : 'password'}
              placeholder={isAr ? 'كلمة المرور' : 'Password'}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
            />
            <button
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full border border-brand-500/20 bg-white px-3 py-1 text-[11px] font-semibold text-stone-600"
              type="button"
              onClick={() => setShowPassword((p) => !p)}
            >
              {showPassword ? (isAr ? 'اخفاء' : 'Hide') : isAr ? 'اظهار' : 'Show'}
            </button>
          </div>
          <button
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
            type="submit"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : null}
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

function AdminDashboard({ isAr, t, apiBase }) {
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryForm, setCategoryForm] = useState({ id: null, name: '' })
  const [productForm, setProductForm] = useState({
    id: null,
    category: '',
    name: '',
    description: '',
    price: '',
    sale_price: '',
    image_url: '',
    imageFile: null,
    is_active: true,
  })

  const fetchAdminData = async () => {
    setLoading(true)
    setError('')
    try {
      const [productsResponse, usersResponse, categoriesResponse, ordersResponse] =
        await Promise.all([
          fetch(`${apiBase}/products/`, { credentials: 'include' }),
          fetch(`${apiBase}/admin/users/`, { credentials: 'include' }),
          fetch(`${apiBase}/categories/`, { credentials: 'include' }),
          fetch(`${apiBase}/orders/`, { credentials: 'include' }),
        ])
      if (!productsResponse.ok || !usersResponse.ok || !categoriesResponse.ok) {
        throw new Error('Failed to load admin data')
      }
      const productsData = await productsResponse.json()
      const usersData = await usersResponse.json()
      const categoriesData = await categoriesResponse.json()
      setProducts(Array.isArray(productsData) ? productsData : productsData.results || [])
      setUsers(Array.isArray(usersData) ? usersData : usersData.results || [])
      setCategories(
        Array.isArray(categoriesData) ? categoriesData : categoriesData.results || []
      )
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(Array.isArray(ordersData) ? ordersData : ordersData.results || [])
      } else {
        setOrders([])
      }
    } catch {
      setError(isAr ? 'تعذر تحميل بيانات الأدمن الآن.' : 'Unable to load admin data right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  const resetProductForm = () => {
    setProductForm({
      id: null,
      category: '',
      name: '',
      description: '',
      price: '',
      sale_price: '',
      image_url: '',
      imageFile: null,
      is_active: true,
    })
  }

  const handleProductSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const payload = new FormData()
      payload.append('category', productForm.category || '')
      payload.append('name', productForm.name)
      payload.append('description', productForm.description)
      payload.append('price', productForm.price)
      if (productForm.sale_price) payload.append('sale_price', productForm.sale_price)
      payload.append('image_url', productForm.image_url)
      payload.append('is_active', productForm.is_active ? 'true' : 'false')
      if (productForm.imageFile) payload.append('image', productForm.imageFile)
      const target = productForm.id
        ? `${apiBase}/products/${productForm.id}/`
        : `${apiBase}/products/`
      const method = productForm.id ? 'PATCH' : 'POST'
      const response = await fetch(target, { method, credentials: 'include', body: payload })
      if (!response.ok) throw new Error('Save failed')
      resetProductForm()
      fetchAdminData()
    } catch {
      setError(isAr ? 'فشل حفظ المنتج.' : 'Failed to save product.')
    }
  }

  const handleProductEdit = (product) => {
    setProductForm({
      id: product.id,
      category: product.category || '',
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      sale_price: product.sale_price || '',
      image_url: product.image_url || '',
      imageFile: null,
      is_active: product.is_active,
    })
  }

  const handleProductDelete = async (productId) => {
    setError('')
    try {
      const response = await fetch(`${apiBase}/products/${productId}/`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Delete failed')
      fetchAdminData()
    } catch {
      setError(isAr ? 'فشل حذف المنتج.' : 'Failed to delete product.')
    }
  }

  const resetCategoryForm = () => setCategoryForm({ id: null, name: '' })

  const handleCategorySubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const target = categoryForm.id
        ? `${apiBase}/categories/${categoryForm.id}/`
        : `${apiBase}/categories/`
      const method = categoryForm.id ? 'PATCH' : 'POST'
      const response = await fetch(target, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: categoryForm.name }),
      })
      if (!response.ok) throw new Error('Category save failed')
      resetCategoryForm()
      fetchAdminData()
    } catch {
      setError(isAr ? 'فشل حفظ القسم.' : 'Failed to save category.')
    }
  }

  const handleCategoryEdit = (category) => {
    setCategoryForm({ id: category.id, name: category.name })
  }

  const handleCategoryDelete = async (categoryId) => {
    setError('')
    try {
      const response = await fetch(`${apiBase}/categories/${categoryId}/`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Category delete failed')
      fetchAdminData()
    } catch {
      setError(isAr ? 'فشل حذف القسم.' : 'Failed to delete category.')
    }
  }

  const handleToggleAdmin = async (user) => {
    setError('')
    try {
      const response = await fetch(`${apiBase}/admin/users/${user.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_staff: !user.is_staff }),
      })
      if (!response.ok) throw new Error('Update failed')
      fetchAdminData()
    } catch {
      setError(isAr ? 'فشل تحديث صلاحيات المستخدم.' : 'Failed to update user role.')
    }
  }

  return (
    <div
      className={`min-h-screen bg-sand-50 text-stone-900 ${isAr ? 'font-ar' : 'font-en'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-10">
        <header className="glass-surface sticky top-4 z-20 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-500/10 px-5 py-3 shadow-soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
              {isAr ? 'لوحة التحكم' : 'Admin panel'}
            </p>
            <h2 className="font-display text-2xl text-stone-900">{t.nav.admin}</h2>
          </div>
          <Link
            className="rounded-full border border-brand-500/20 bg-white px-4 py-2 text-xs font-semibold text-stone-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow"
            to="/"
          >
            {isAr ? 'العودة للمتجر' : 'Back to store'}
          </Link>
        </header>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-56 rounded-3xl bg-white/70 shadow-soft" />
            <div className="h-56 rounded-3xl bg-white/70 shadow-soft" />
          </div>
        ) : (
          <>
            <section className="space-y-4 rounded-3xl border border-brand-500/10 bg-white/80 p-6 shadow-soft">
              <h3 className="font-display text-xl text-stone-900">
                {isAr ? 'الطلبات' : 'Orders'}
              </h3>
              <p className="text-xs text-stone-500">
                {isAr ? 'طلبات العملاء (ضيف أو مسجّل).' : 'Customer orders from checkout.'}
              </p>
              {!orders.length ? (
                <p className="text-sm text-stone-500">{isAr ? 'لا طلبات بعد.' : 'No orders yet.'}</p>
              ) : (
                <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1">
                  {orders.map((order) => (
                    <div
                      className="rounded-2xl border border-brand-500/10 bg-white px-4 py-3 text-sm"
                      key={order.id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-stone-900">
                            #{order.id} · {order.customer_name}
                          </p>
                          <p className="text-xs text-stone-500">{order.customer_phone}</p>
                          <p className="mt-1 text-xs text-stone-600">{order.customer_address}</p>
                        </div>
                        <div className="text-end text-xs text-stone-500">
                          <p className="font-semibold text-stone-900">
                            {formatPrice(order.total, isAr)}
                          </p>
                          <p>{order.status}</p>
                          <p>{new Date(order.created_at).toLocaleString(isAr ? 'ar-EG' : 'en-EG')}</p>
                        </div>
                      </div>
                      <ul className="mt-2 space-y-1 border-t border-brand-500/10 pt-2 text-xs text-stone-600">
                        {(order.items || []).map((item) => (
                          <li key={item.id}>
                            {item.product_name} × {item.quantity} — {formatPrice(item.unit_price, isAr)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-4 rounded-3xl border border-brand-500/10 bg-white/80 p-6 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl text-stone-900">
                      {isAr ? 'إدارة المنتجات' : 'Manage products'}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {isAr ? 'أضف أو عدل منتجات المتجر.' : 'Add or edit store products.'}
                    </p>
                  </div>
                  <button
                    className="rounded-full border border-brand-500/20 px-4 py-2 text-xs font-semibold text-stone-600"
                    type="button"
                    onClick={resetProductForm}
                  >
                    {isAr ? 'منتج جديد' : 'New product'}
                  </button>
                </div>

                <form className="grid gap-3" onSubmit={handleProductSubmit}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="rounded-2xl border border-brand-500/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500/40"
                      placeholder={isAr ? 'اسم المنتج' : 'Product name'}
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                    <input
                      className="rounded-2xl border border-brand-500/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500/40"
                      placeholder={isAr ? 'رابط الصورة' : 'Image URL'}
                      value={productForm.image_url}
                      onChange={(e) =>
                        setProductForm((prev) => ({ ...prev, image_url: e.target.value }))
                      }
                    />
                  </div>
                  <select
                    className="rounded-2xl border border-brand-500/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500/40"
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                  >
                    <option value="">{isAr ? 'اختر القسم' : 'Select category'}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-brand-500/10 bg-white px-4 py-2 text-xs text-stone-600">
                    <span>{isAr ? 'ارفع صورة المنتج' : 'Upload product image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          imageFile: e.target.files?.[0] || null,
                        }))
                      }
                    />
                  </label>
                  <textarea
                    className="min-h-[90px] rounded-2xl border border-brand-500/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500/40"
                    placeholder={isAr ? 'وصف المنتج' : 'Product description'}
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      className="rounded-2xl border border-brand-500/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500/40"
                      placeholder={isAr ? 'السعر' : 'Price'}
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm((prev) => ({ ...prev, price: e.target.value }))
                      }
                      required
                    />
                    <input
                      className="rounded-2xl border border-brand-500/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500/40"
                      placeholder={isAr ? 'سعر التخفيض' : 'Sale price'}
                      type="number"
                      step="0.01"
                      value={productForm.sale_price}
                      onChange={(e) =>
                        setProductForm((prev) => ({ ...prev, sale_price: e.target.value }))
                      }
                    />
                    <label className="flex items-center gap-2 rounded-2xl border border-brand-500/10 bg-white px-4 py-2 text-xs text-stone-600">
                      <input
                        type="checkbox"
                        checked={productForm.is_active}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            is_active: e.target.checked,
                          }))
                        }
                      />
                      {isAr ? 'نشط' : 'Active'}
                    </label>
                  </div>
                  <button
                    className="w-fit rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow"
                    type="submit"
                  >
                    {productForm.id
                      ? isAr
                        ? 'تحديث المنتج'
                        : 'Update product'
                      : isAr
                        ? 'إضافة المنتج'
                        : 'Add product'}
                  </button>
                </form>

                <div className="grid gap-3">
                  {products.map((product) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-500/10 bg-white px-4 py-3"
                      key={product.id}
                    >
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{product.name}</p>
                        <p className="text-xs text-stone-500">
                          {product.category_name || (isAr ? 'بدون قسم' : 'No category')}
                          {' • '}
                          {product.is_active
                            ? isAr
                              ? 'نشط'
                              : 'Active'
                            : isAr
                              ? 'غير نشط'
                              : 'Inactive'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-full border border-brand-500/20 px-3 py-1 text-[11px] font-semibold text-stone-600"
                          type="button"
                          onClick={() => handleProductEdit(product)}
                        >
                          {isAr ? 'تعديل' : 'Edit'}
                        </button>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1 text-[11px] font-semibold text-red-500"
                          type="button"
                          onClick={() => handleProductDelete(product.id)}
                        >
                          {isAr ? 'حذف' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="space-y-6">
                <section className="space-y-4 rounded-3xl border border-brand-500/10 bg-white/80 p-6 shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl text-stone-900">
                        {isAr ? 'إدارة الأقسام' : 'Manage categories'}
                      </h3>
                      <p className="text-xs text-stone-500">
                        {isAr ? 'أضف أو عدل الأقسام.' : 'Add or edit categories.'}
                      </p>
                    </div>
                    <button
                      className="rounded-full border border-brand-500/20 px-4 py-2 text-xs font-semibold text-stone-600"
                      type="button"
                      onClick={resetCategoryForm}
                    >
                      {isAr ? 'قسم جديد' : 'New category'}
                    </button>
                  </div>

                  <form className="grid gap-3" onSubmit={handleCategorySubmit}>
                    <input
                      className="rounded-2xl border border-brand-500/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500/40"
                      placeholder={isAr ? 'اسم القسم' : 'Category name'}
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                    <button
                      className="w-fit rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow"
                      type="submit"
                    >
                      {categoryForm.id
                        ? isAr
                          ? 'تحديث القسم'
                          : 'Update category'
                        : isAr
                          ? 'إضافة القسم'
                          : 'Add category'}
                    </button>
                  </form>

                  <div className="grid gap-3">
                    {categories.map((category) => (
                      <div
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-500/10 bg-white px-4 py-3"
                        key={category.id}
                      >
                        <p className="text-sm font-semibold text-stone-900">{category.name}</p>
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-full border border-brand-500/20 px-3 py-1 text-[11px] font-semibold text-stone-600"
                            type="button"
                            onClick={() => handleCategoryEdit(category)}
                          >
                            {isAr ? 'تعديل' : 'Edit'}
                          </button>
                          <button
                            className="rounded-full border border-red-200 px-3 py-1 text-[11px] font-semibold text-red-500"
                            type="button"
                            onClick={() => handleCategoryDelete(category.id)}
                          >
                            {isAr ? 'حذف' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4 rounded-3xl border border-brand-500/10 bg-white/80 p-6 shadow-soft">
                  <div>
                    <h3 className="font-display text-xl text-stone-900">
                      {isAr ? 'إدارة المستخدمين' : 'Manage users'}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {isAr ? 'ترقية المستخدمين إلى أدمن.' : 'Promote users to admin.'}
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {users.map((user) => (
                      <div
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-500/10 bg-white px-4 py-3"
                        key={user.id}
                      >
                        <div>
                          <p className="text-sm font-semibold text-stone-900">{user.username}</p>
                          <p className="text-xs text-stone-500">
                            {user.is_staff
                              ? isAr
                                ? 'أدمن'
                                : 'Admin'
                              : isAr
                                ? 'عميل'
                                : 'Customer'}
                          </p>
                        </div>
                        <button
                          className="rounded-full border border-brand-500/20 px-3 py-1 text-[11px] font-semibold text-stone-600"
                          type="button"
                          onClick={() => handleToggleAdmin(user)}
                        >
                          {user.is_staff
                            ? isAr
                              ? 'إزالة الأدمن'
                              : 'Remove admin'
                            : isAr
                              ? 'ترقية لأدمن'
                              : 'Make admin'}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
