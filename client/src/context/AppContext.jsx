import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import en from '../locales/en.json'
import ar from '../locales/ar.json'
import { CART_STORAGE_KEY, getApiOrigin } from '../lib/formatters'

const AppContext = createContext(null)
const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || 'https://osama324.pythonanywhere.com/api'

function readStoredBoolean(key, fallback = false) {
  try {
    const stored = localStorage.getItem(key)
    if (stored == null) return fallback
    return stored === '1'
  } catch {
    return fallback
  }
}

export function AppProvider({ children }) {
  const [lang, setLang] = useState('en')
  const [nudePalette, setNudePalette] = useState(false)
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
  const [cartVersion, setCartVersion] = useState(0)
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])

  const apiBase = DEFAULT_API_BASE
  const apiOrigin = useMemo(() => getApiOrigin(apiBase), [apiBase])
  const isAr = lang === 'ar'
  const t = useMemo(() => (isAr ? ar : en), [isAr])

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem('andiana-lang')
      if (storedLang === 'ar' || storedLang === 'en') setLang(storedLang)
      setNudePalette(readStoredBoolean('palette_nude', false))
    } catch {
      setLang('en')
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('andiana-lang', lang)
      document.documentElement.lang = lang
      document.documentElement.dir = isAr ? 'rtl' : 'ltr'
    } catch {}
  }, [isAr, lang])

  useEffect(() => {
    try {
      document.documentElement.classList.toggle('palette-nude', nudePalette)
      localStorage.setItem('palette_nude', nudePalette ? '1' : '0')
    } catch {}
  }, [nudePalette])

  const setLanguage = useCallback((nextLang) => setLang(nextLang), [])
  const togglePalette = useCallback(() => setNudePalette((current) => !current), [])

  const authFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('No token found')

    const headers = new Headers(options.headers || {})
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    headers.set('Authorization', `Bearer ${token}`)

    return fetch(url, { ...options, headers })
  }, [])

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('No token found')
    const response = await fetch(`${apiBase}/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Unauthorized')
    return response.json()
  }, [apiBase])

  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) return false

    try {
      const response = await fetch(`${apiBase}/token/cookie/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (!response.ok) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        return false
      }

      const data = await response.json()
      localStorage.setItem('access_token', data.access)
      if (data.refresh) localStorage.setItem('refresh_token', data.refresh)
      return true
    } catch {
      return false
    }
  }, [apiBase])

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
    const existingId = localStorage.getItem(CART_STORAGE_KEY)
    if (existingId) {
      const existingResponse = await fetch(`${apiBase}/carts/${existingId}/`)
      if (existingResponse.ok) {
        const data = await existingResponse.json()
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

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true)
    setProductsError('')
    try {
      const response = await fetch(`${apiBase}/products/`)
      if (!response.ok) throw new Error('products')
      const data = await response.json()
      setProducts(Array.isArray(data) ? data : data.results || [])
    } catch {
      setProductsError(isAr ? 'تعذر تحميل المنتجات الآن' : 'Unable to load products right now')
    } finally {
      setProductsLoading(false)
    }
  }, [apiBase, isAr])

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true)
    setCategoriesError('')
    try {
      const response = await fetch(`${apiBase}/categories/`)
      if (!response.ok) throw new Error('categories')
      const data = await response.json()
      setCategories(Array.isArray(data) ? data : data.results || [])
    } catch {
      setCategoriesError(isAr ? 'تعذر تحميل الأقسام الآن' : 'Unable to load categories right now')
    } finally {
      setCategoriesLoading(false)
    }
  }, [apiBase, isAr])

  const handleLogin = useCallback(async (payload) => {
    setAuthError('')
    setAuthLoading(true)
    try {
      const response = await fetch(`${apiBase}/token/cookie/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('login')
      const data = await response.json()
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      setAuthUser(await fetchProfile())
      return true
    } catch {
      setAuthError(isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials')
      return false
    } finally {
      setAuthLoading(false)
    }
  }, [apiBase, fetchProfile, isAr])

  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      try {
        await fetch(`${apiBase}/logout/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        })
      } catch {}
    }

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setAuthUser(null)
  }, [apiBase])

  const addToCart = useCallback(async (productId, selectedColor = null, delta = 1) => {
    setCartBusy(true)
    try {
      const row = await ensureCart()
      
      // هنا بنتأكد إننا بنشوف الكمية الحالية لنفس المنتج *بنفس اللون* لو موجود في السلة
      const currentLine = row.items?.find(
        (line) => line.product?.id === productId && line.selected_color === selectedColor
      )
      const current = currentLine?.quantity || 0
      const quantity = current + delta

      // بنجهز الداتا اللي هتتبعت للباك إند
      const payload = { product: productId, quantity }
      
      // لو العميل اختار لون، بنضيفه للـ payload
      if (selectedColor) {
        payload.selected_color = selectedColor
      }

      const response = await fetch(`${apiBase}/carts/${row.id}/items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) throw new Error('add')
      setCart(await response.json())
      setCartVersion((currentVersion) => currentVersion + 1)
    } finally {
      setCartBusy(false)
    }
  }, [apiBase, ensureCart])

  const updateCartLineQuantity = useCallback(async (productId, quantity, selectedColor = "") => {
    const id = localStorage.getItem(CART_STORAGE_KEY)
    if (!id) return
    setCartBusy(true)
    try {
      // لازم نبعت اللون دايماً عشان الباك إند يعرف إحنا بنعدل كمية أنهي منتج بالظبط
      const payload = { product: productId, quantity, selected_color: selectedColor }

      const response = await fetch(`${apiBase}/carts/${id}/items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('qty')
      setCart(await response.json())
      setCartVersion((currentVersion) => currentVersion + 1)
    } finally {
      setCartBusy(false)
    }
  }, [apiBase])
  const removeCartLine = useCallback(async (itemId) => {
    const id = localStorage.getItem(CART_STORAGE_KEY)
    if (!id) return
    setCartBusy(true)
    try {
      const response = await fetch(`${apiBase}/carts/${id}/items/${itemId}/`, { method: 'DELETE' })
      if (!response.ok) throw new Error('delete')
      setCart(await response.json())
      setCartVersion((currentVersion) => currentVersion + 1)
    } finally {
      setCartBusy(false)
    }
  }, [apiBase])

  const checkout = useCallback(async (payload) => {
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
    setCartVersion((currentVersion) => currentVersion + 1)
    return order
  }, [apiBase])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      await Promise.all([fetchProducts(), fetchCategories(), refreshCart()])
      try {
        const profile = await fetchProfile()
        if (!cancelled) setAuthUser(profile)
      } catch {
        const refreshed = await refreshAccessToken()
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
  }, [fetchCategories, fetchProducts, fetchProfile, refreshAccessToken, refreshCart])

  const cartItemCount = useMemo(
    () => cart?.items?.reduce((acc, line) => acc + (line.quantity || 0), 0) ?? 0,
    [cart],
  )

  const value = useMemo(
    () => ({
      apiBase,
      apiOrigin,
      t,
      lang,
      setLang: setLanguage,
      isAr,
      nudePalette,
      setNudePalette,
      togglePalette,
      authUser,
      authError,
      setAuthError,
      authLoading,
      handleLogin,
      handleLogout,
      authFetch,
      products,
      productsLoading,
      productsError,
      categories,
      categoriesLoading,
      categoriesError,
      users,
      setUsers,
      orders,
      setOrders,
      setProducts,
      setCategories,
      cart,
      cartBusy,
      cartItemCount,
      cartVersion,
      refreshCart,
      addToCart,
      updateCartLineQuantity,
      removeCartLine,
      checkout,
      fetchProducts,
      fetchCategories,
    }),
    [
      apiBase,
      apiOrigin,
      t,
      lang,
      setLanguage,
      isAr,
      nudePalette,
      togglePalette,
      authUser,
      authError,
      authLoading,
      handleLogin,
      handleLogout,
      authFetch,
      products,
      productsLoading,
      productsError,
      categories,
      categoriesLoading,
      categoriesError,
      users,
      setUsers,
      orders,
      setOrders,
      setProducts,
      setCategories,
      cart,
      cartBusy,
      cartItemCount,
      cartVersion,
      refreshCart,
      addToCart,
      updateCartLineQuantity,
      removeCartLine,
      checkout,
      fetchProducts,
      fetchCategories,
      apiOrigin,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
