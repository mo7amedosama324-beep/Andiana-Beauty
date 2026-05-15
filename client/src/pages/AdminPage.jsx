import { useCallback, useEffect, useMemo, useState } from 'react'
import ConfirmModal from '../components/ConfirmModal'
import PageShell from '../components/PageShell'
import { formatPrice } from '../lib/formatters'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'

export default function AdminPage() {
  const { isAr, setLang, t, apiBase, authFetch, products, setProducts, categories, setCategories, users, setUsers, orders, setOrders, authUser, handleLogout, cartItemCount, nudePalette, togglePalette } = useApp()
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categoryForm, setCategoryForm] = useState({ id: null, name: '' })
  const [productForm, setProductForm] = useState({ id: null, category: '', name: '', description: '', price: '', sale_price: '', image_url: '', imageFile: null, is_active: true })
  const [deleteTarget, setDeleteTarget] = useState(null)

  const stats = useMemo(() => ([
    { label: t.admin.orders, value: orders.length },
    { label: t.admin.products, value: products.length },
    { label: t.admin.categories, value: categories.length },
    { label: t.admin.users, value: users.length },
  ]), [categories.length, orders.length, products.length, t.admin.categories, t.admin.orders, t.admin.products, t.admin.users, users.length])

  const refreshAdminData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [productsResponse, usersResponse, categoriesResponse, ordersResponse] = await Promise.all([
        authFetch(`${apiBase}/products/`),
        authFetch(`${apiBase}/admin/users/`),
        authFetch(`${apiBase}/categories/`),
        authFetch(`${apiBase}/orders/`),
      ])
      if (!productsResponse.ok || !usersResponse.ok || !categoriesResponse.ok) throw new Error('load')
      const productsData = await productsResponse.json()
      const usersData = await usersResponse.json()
      const categoriesData = await categoriesResponse.json()
      setProducts(Array.isArray(productsData) ? productsData : productsData.results || [])
      setUsers(Array.isArray(usersData) ? usersData : usersData.results || [])
      setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.results || [])
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
  }, [apiBase, authFetch, isAr, setCategories, setOrders, setProducts, setUsers])

  useEffect(() => {
    refreshAdminData()
  }, [refreshAdminData])

  const resetProductForm = () => setProductForm({ id: null, category: '', name: '', description: '', price: '', sale_price: '', image_url: '', imageFile: null, is_active: true })
  const resetCategoryForm = () => setCategoryForm({ id: null, name: '' })

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
      const target = productForm.id ? `${apiBase}/products/${productForm.id}/` : `${apiBase}/products/`
      const method = productForm.id ? 'PATCH' : 'POST'
      const response = await authFetch(target, { method, body: payload })
      if (!response.ok) throw new Error('save')
      pushToast({ type: 'success', message: isAr ? 'تم حفظ المنتج.' : 'Product saved.' })
      resetProductForm()
      refreshAdminData()
    } catch {
      setError(isAr ? 'فشل حفظ المنتج.' : 'Failed to save product.')
    }
  }

  const handleCategorySubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const target = categoryForm.id ? `${apiBase}/categories/${categoryForm.id}/` : `${apiBase}/categories/`
      const method = categoryForm.id ? 'PATCH' : 'POST'
      const response = await authFetch(target, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryForm.name }),
      })
      if (!response.ok) throw new Error('save')
      pushToast({ type: 'success', message: isAr ? 'تم حفظ القسم.' : 'Category saved.' })
      resetCategoryForm()
      refreshAdminData()
    } catch {
      setError(isAr ? 'فشل حفظ القسم.' : 'Failed to save category.')
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return
    const { type, id } = deleteTarget
    const targetUrl = type === 'product' ? `${apiBase}/products/${id}/` : `${apiBase}/categories/${id}/`
    const response = await authFetch(targetUrl, { method: 'DELETE' })
    if (!response.ok) {
      setError(type === 'product' ? (isAr ? 'فشل حذف المنتج.' : 'Failed to delete product.') : (isAr ? 'فشل حذف القسم.' : 'Failed to delete category.'))
      return
    }
    pushToast({ type: 'success', message: isAr ? 'تم الحذف.' : 'Deleted.' })
    setDeleteTarget(null)
    refreshAdminData()
  }

  const handleToggleAdmin = async (user) => {
    try {
      const response = await authFetch(`${apiBase}/admin/users/${user.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_staff: !user.is_staff }),
      })
      if (!response.ok) throw new Error('update')
      pushToast({ type: 'success', message: isAr ? 'تم تحديث المستخدم.' : 'User updated.' })
      refreshAdminData()
    } catch {
      setError(isAr ? 'فشل تحديث صلاحيات المستخدم.' : 'Failed to update user role.')
    }
  }

  return (
    <PageShell isAr={isAr} setLang={setLang} t={t} authUser={authUser} onLogout={handleLogout} cartCount={cartItemCount} nudePalette={nudePalette} onTogglePalette={togglePalette}>
      <header className="card-surface p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-stone-400">{t.admin.panel}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-stone-900 sm:text-4xl">{t.admin.panel}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">{t.admin.description}</p>
          </div>
          <button type="button" className="button-surface border border-brand-200 bg-white text-stone-700" onClick={refreshAdminData}>
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <div key={stat.label} className="card-surface p-5"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">{stat.label}</p><p className="mt-2 font-display text-3xl text-stone-900">{stat.value}</p></div>)}
      </section>

      {error ? <p className="rounded-card border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

      <section className="space-y-4 rounded-page border border-white/40 bg-white/80 p-6 shadow-soft backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-stone-900">{t.admin.orders}</h2>
          <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-[11px] font-semibold text-stone-500">{orders.length}</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-brand-100">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-sand-50 text-left text-xs uppercase tracking-[0.2em] text-stone-500">
              <tr>
                <th className="px-4 py-3">#</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-brand-100 transition hover:bg-stone-50">
                  <td className="px-4 py-3 font-semibold text-stone-900">{order.id}</td>
                  <td className="px-4 py-3 text-stone-600"><div className="font-semibold text-stone-900">{order.customer_name}</div><div className="text-xs text-stone-500">{order.customer_phone}</div></td>
                  <td className="px-4 py-3 text-stone-600">{order.status}</td>
                  <td className="px-4 py-3 font-semibold text-stone-900">{formatPrice(order.total, isAr)}</td>
                  <td className="px-4 py-3 text-stone-500">{new Date(order.created_at).toLocaleString(isAr ? 'ar-EG' : 'en-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6 rounded-page border border-white/40 bg-white/80 p-6 shadow-soft backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl text-stone-900">{t.admin.products}</h2><button className="button-surface border border-brand-200 bg-white text-stone-700" type="button" onClick={resetProductForm}>{t.admin.newProduct}</button></div>
          <fieldset className="rounded-2xl border border-brand-100 bg-sand-50/70 p-4">
            <legend className="px-2 text-sm font-semibold text-stone-700">{isAr ? 'بيانات المنتج' : 'Product details'}</legend>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-stone-700"><span>{isAr ? 'اسم المنتج' : 'Product name'}</span><input className="input-surface" value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} /></label>
              <label className="grid gap-2 text-sm font-semibold text-stone-700"><span>{isAr ? 'القسم' : 'Category'}</span><select className="input-surface" value={productForm.category} onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))}><option value="">{isAr ? 'اختر القسم' : 'Select category'}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="grid gap-2 text-sm font-semibold text-stone-700"><span>{isAr ? 'الوصف' : 'Description'}</span><textarea className="input-surface min-h-[110px]" value={productForm.description} onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
              <div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-2 text-sm font-semibold text-stone-700"><span>{isAr ? 'السعر' : 'Price'}</span><input className="input-surface" type="number" step="0.01" value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))} /></label><label className="grid gap-2 text-sm font-semibold text-stone-700"><span>{isAr ? 'سعر التخفيض' : 'Sale price'}</span><input className="input-surface" type="number" step="0.01" value={productForm.sale_price} onChange={(event) => setProductForm((prev) => ({ ...prev, sale_price: event.target.value }))} /></label><label className="grid gap-2 text-sm font-semibold text-stone-700"><span>{isAr ? 'نشط' : 'Active'}</span><input className="h-11 rounded-2xl border border-brand-200 bg-white px-4" type="checkbox" checked={productForm.is_active} onChange={(event) => setProductForm((prev) => ({ ...prev, is_active: event.target.checked }))} /></label></div>
              <label className="grid gap-2 text-sm font-semibold text-stone-700"><span>{isAr ? 'رابط الصورة' : 'Image URL'}</span><input className="input-surface" value={productForm.image_url} onChange={(event) => setProductForm((prev) => ({ ...prev, image_url: event.target.value }))} /></label>
              <label className="grid gap-2 text-sm font-semibold text-stone-700"><span>{isAr ? 'رفع صورة' : 'Upload image'}</span><input className="rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm" type="file" accept="image/*" onChange={(event) => setProductForm((prev) => ({ ...prev, imageFile: event.target.files?.[0] || null }))} /></label>
              <div className="flex gap-3"><button className="button-surface bg-stone-900 text-white" type="button" onClick={handleProductSubmit}>{productForm.id ? t.admin.updateProduct : t.admin.saveProduct}</button></div>
            </div>
          </fieldset>

          <div className="overflow-hidden rounded-2xl border border-brand-100">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-sand-50 text-left text-xs uppercase tracking-[0.2em] text-stone-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Actions</th></tr></thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-brand-100 transition hover:bg-stone-50">
                    <td className="px-4 py-3 font-semibold text-stone-900">{product.name}</td>
                    <td className="px-4 py-3 text-stone-600">{product.category_name || (isAr ? 'بدون قسم' : 'No category')}</td>
                    <td className="px-4 py-3 text-stone-600">{product.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}</td>
                    <td className="px-4 py-3 font-semibold text-stone-900">{formatPrice(product.sale_price || product.price, isAr)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button className="button-surface border border-brand-200 bg-white text-stone-700" type="button" onClick={() => setProductForm({ id: product.id, category: product.category || '', name: product.name || '', description: product.description || '', price: product.price || '', sale_price: product.sale_price || '', image_url: product.image_url || '', imageFile: null, is_active: product.is_active })}>{t.admin.edit}</button>
                        <button className="button-surface border border-rose-200 bg-white text-rose-600" type="button" onClick={() => setDeleteTarget({ type: 'product', id: product.id })}>{t.admin.delete}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="space-y-6 rounded-page border border-white/40 bg-white/80 p-6 shadow-soft backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl text-stone-900">{t.admin.categories}</h2><button className="button-surface border border-brand-200 bg-white text-stone-700" type="button" onClick={resetCategoryForm}>{t.admin.newCategory}</button></div>
            <fieldset className="rounded-2xl border border-brand-100 bg-sand-50/70 p-4">
              <legend className="px-2 text-sm font-semibold text-stone-700">{isAr ? 'بيانات القسم' : 'Category details'}</legend>
              <label className="mt-4 grid gap-2 text-sm font-semibold text-stone-700"><span>{isAr ? 'اسم القسم' : 'Category name'}</span><input className="input-surface" value={categoryForm.name} onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))} /></label>
              <button className="mt-4 button-surface bg-stone-900 text-white" type="button" onClick={handleCategorySubmit}>{categoryForm.id ? t.admin.updateCategory : t.admin.saveCategory}</button>
            </fieldset>
            <div className="overflow-hidden rounded-2xl border border-brand-100">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-sand-50 text-left text-xs uppercase tracking-[0.2em] text-stone-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Actions</th></tr></thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-t border-brand-100 transition hover:bg-stone-50">
                      <td className="px-4 py-3 font-semibold text-stone-900">{category.name}</td>
                      <td className="px-4 py-3"><div className="flex gap-2"><button className="button-surface border border-brand-200 bg-white text-stone-700" type="button" onClick={() => setCategoryForm({ id: category.id, name: category.name })}>{t.admin.edit}</button><button className="button-surface border border-rose-200 bg-white text-rose-600" type="button" onClick={() => setDeleteTarget({ type: 'category', id: category.id })}>{t.admin.delete}</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4 rounded-page border border-white/40 bg-white/80 p-6 shadow-soft backdrop-blur-sm">
            <h2 className="font-display text-2xl text-stone-900">{t.admin.users}</h2>
            <div className="overflow-hidden rounded-2xl border border-brand-100">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-sand-50 text-left text-xs uppercase tracking-[0.2em] text-stone-500"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Actions</th></tr></thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-brand-100 transition hover:bg-stone-50">
                      <td className="px-4 py-3 font-semibold text-stone-900">{user.username}</td>
                      <td className="px-4 py-3 text-stone-600">{user.is_staff ? (isAr ? 'أدمن' : 'Admin') : (isAr ? 'عميل' : 'Customer')}</td>
                      <td className="px-4 py-3"><button className="button-surface border border-brand-200 bg-white text-stone-700" type="button" onClick={() => handleToggleAdmin(user)}>{user.is_staff ? (isAr ? 'إزالة الأدمن' : 'Remove admin') : (isAr ? 'ترقية لأدمن' : 'Make admin')}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={t.admin.confirmDeleteTitle}
        body={t.admin.confirmDeleteBody}
        confirmLabel={t.admin.confirm}
        cancelLabel={t.admin.cancel}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  )
}
