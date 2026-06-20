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
  
  const [productForm, setProductForm] = useState({ 
    id: null, category: '', name: '', description: '', 
    price: '', sale_price: '', imageFile: null, is_active: true,
    currentImage: '' 
  })
  const [categoryForm, setCategoryForm] = useState({ id: null, name: '' })
  
  const [productColors, setProductColors] = useState([]) 
  const [additionalImages, setAdditionalImages] = useState([]) 
  const [additionalImageUrls, setAdditionalImageUrls] = useState([]) 

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

  const resetProductForm = () => {
    setProductForm({ id: null, category: '', name: '', description: '', price: '', sale_price: '', imageFile: null, is_active: true, currentImage: '' })
    setProductColors([])
    setAdditionalImages([])
    setAdditionalImageUrls([])
  }
  
  const resetCategoryForm = () => setCategoryForm({ id: null, name: '' })

  const addColorField = () => setProductColors([...productColors, { color_name: '', color_code: '#000000' }])
  const removeColorField = (index) => setProductColors(productColors.filter((_, i) => i !== index))
  const updateColorField = (index, field, value) => {
    const newColors = [...productColors]
    newColors[index][field] = value
    setProductColors(newColors)
  }

  const handleProductSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const formData = new FormData()
      formData.append('category', productForm.category || '')
      formData.append('name', productForm.name)
      formData.append('description', productForm.description)
      formData.append('price', productForm.price)
      if (productForm.sale_price) formData.append('sale_price', productForm.sale_price)
      formData.append('is_active', productForm.is_active ? 'true' : 'false')

      if (productForm.imageFile) formData.append('image', productForm.imageFile)

      additionalImages.forEach((file) => {
        formData.append('additional_images', file)
      })

      if (productForm.id) {
        formData.append('additional_images_data', JSON.stringify(additionalImageUrls))
      }

      formData.append('colors_data', JSON.stringify(productColors))

      const target = productForm.id ? `${apiBase}/products/${productForm.id}/` : `${apiBase}/products/`
      const method = productForm.id ? 'PATCH' : 'POST'
      
      const response = await authFetch(target, { method, body: formData })
      if (!response.ok) throw new Error('save')
      
      pushToast({ type: 'success', message: isAr ? 'تم حفظ المنتج بنجاح.' : 'Product saved successfully.' })
      resetProductForm()
      refreshAdminData()
    } catch {
      setError(isAr ? 'فشل حفظ المنتج. تأكد من البيانات.' : 'Failed to save product.')
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

  const deleteOrder = async (orderId) => {
    if (!window.confirm(isAr ? "هل أنت متأكد من مسح هذا الأوردر؟" : "Are you sure you want to delete this order?")) return;

    try {
      const response = await authFetch(`${apiBase}/orders/${orderId}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        pushToast({ type: 'success', message: isAr ? 'تم حذف الأوردر بنجاح' : 'Order deleted successfully' })
        refreshAdminData()
      } else {
        setError(isAr ? 'فشل الحذف، تأكد من صلاحيات الإدمن' : 'Delete failed, check admin permissions')
      }
    } catch (error) {
      console.error("Error deleting order:", error)
      setError(isAr ? 'حدث خطأ أثناء حذف الأوردر' : 'Error deleting order')
    }
  }

  return (
    <PageShell isAr={isAr} setLang={setLang} t={t} authUser={authUser} onLogout={handleLogout} cartCount={cartItemCount} nudePalette={nudePalette} onTogglePalette={togglePalette}>
      <header className="card-surface p-4 sm:p-6 w-full max-w-full overflow-hidden">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-stone-400">{t.admin.panel}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl sm:text-4xl text-stone-900 break-words">{t.admin.panel}</h1>
            <p className="mt-2 text-xs sm:text-sm leading-6 text-stone-600 break-words max-w-3xl">{t.admin.description}</p>
          </div>
          <button type="button" className="button-surface border border-brand-200 bg-white text-stone-700 whitespace-nowrap" onClick={refreshAdminData}>
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </header>

      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4 w-full max-w-full">
        {stats.map((stat) => (
          <div key={stat.label} className="card-surface p-4 sm:p-5 min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.3em] text-stone-400 truncate">{stat.label}</p>
            <p className="mt-1 font-display text-xl sm:text-3xl text-stone-900 truncate">{stat.value}</p>
          </div>
        ))}
      </section>

      {error ? <p className="rounded-card border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 break-words w-full">{error}</p> : null}

      {/* 📦 قسم الطلبات - متجاوب تماماً وبدون أي سحب يمين/شمال */}
      <section className="space-y-4 rounded-page border border-white/40 bg-white/80 p-4 sm:p-6 shadow-soft backdrop-blur-sm w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl sm:text-2xl text-stone-900">{t.admin.orders}</h2>
          <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-[11px] font-semibold text-stone-500 whitespace-nowrap">{orders.length}</span>
        </div>

        {/* 🖥️ شاشات الكمبيوتر والتابلت: جدول بـ Scroll داخلي معزول لو الشاشة صغرت */}
        <div className="hidden md:block overflow-x-auto w-full rounded-2xl border border-brand-100">
          <table className="min-w-full border-collapse text-sm table-auto">
            <thead className="bg-sand-50 text-left text-xs uppercase tracking-[0.2em] text-stone-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">{isAr ? 'العميل' : 'Customer'}</th>
                <th className="px-4 py-3">{isAr ? 'المنتجات واللون' : 'Products & Color'}</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-brand-100 transition hover:bg-stone-50">
                  <td className="px-4 py-3 font-semibold text-stone-900">{order.id}</td>
                  <td className="px-4 py-3 text-stone-600">
                    <div className="font-semibold text-stone-900 whitespace-nowrap">{order.customer_name}</div>
                    <div className="text-xs text-stone-500 font-mono">{order.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    <div className="space-y-2">
                      {order.items && order.items.map((item, index) => {
                        let colorStyle = '#ffffff'; 
                        let colorTextToShow = '';
                        if (item.selected_color) {
                          if (typeof item.selected_color === 'object') {
                            colorStyle = item.selected_color.color_code || item.selected_color.code || '#ffffff';
                            colorTextToShow = item.selected_color.color_name || colorStyle;
                          } else {
                            const colorStr = String(item.selected_color);
                            colorTextToShow = colorStr;
                            const currentProduct = products.find(p => p.name === item.product_name);
                            const matchedColorObj = currentProduct?.colors?.find(c => String(c.color_name) === colorStr);
                            if (matchedColorObj?.color_code) {
                              colorStyle = matchedColorObj.color_code;
                            } else if (/^[0-9A-F]{6}$/i.test(colorStr)) {
                              colorStyle = `#${colorStr}`;
                            } else {
                              colorStyle = colorStr; 
                            }
                          }
                        }
                        return (
                          <div key={index} className="flex items-center gap-2 text-xs text-stone-800">
                            <span className="font-medium text-stone-900 whitespace-nowrap">{item.product_name}</span>
                            <span className="text-stone-400 font-sans">({item.quantity}x)</span>
                            {item.selected_color ? (
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className="inline-block h-4 w-4 rounded-full border border-stone-300 shadow-sm" style={{ backgroundColor: colorStyle }} title={`درجة: ${colorTextToShow}`} />
                                <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">{colorTextToShow}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-stone-400 italic whitespace-nowrap">{isAr ? 'بدون لون' : 'No color'}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{order.status}</td>
                  <td className="px-4 py-3 font-semibold text-stone-900 whitespace-nowrap">{formatPrice(order.total, isAr)}</td>
                  <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{new Date(order.created_at).toLocaleString(isAr ? 'ar-EG' : 'en-EG')}</td>
                  <td className="px-4 py-3">
                    <button className="button-surface border border-rose-200 bg-white text-rose-600 whitespace-nowrap" type="button" onClick={() => deleteOrder(order.id)}>{t.admin.delete}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📱 شاشات الموبايل: كروت منظمة ومحكومة العرض تماماً لمنع أي سحب خارجي */}
        <div className="block md:hidden space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-brand-100 bg-white/95 p-4 shadow-sm space-y-3 w-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-stone-100/80 pb-2 gap-2">
                <div className="min-w-0">
                  <span className="text-xs text-stone-400 font-mono">#</span>
                  <span className="font-bold text-stone-900 font-mono">{order.id}</span>
                </div>
                <div className="text-[10px] text-stone-500 font-mono truncate">{new Date(order.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-EG')}</div>
                <span className="rounded bg-sand-100 px-2 py-0.5 text-[11px] font-medium text-stone-700 whitespace-nowrap">{order.status}</span>
              </div>

              <div className="text-sm min-w-0">
                <div className="font-bold text-stone-900 break-words">{order.customer_name}</div>
                <div className="text-xs text-stone-500 font-mono mt-0.5 break-all">{order.customer_phone}</div>
              </div>

              <div className="rounded-lg bg-stone-50 p-2.5 space-y-2.5 w-full">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{isAr ? 'الطلبات المرفقة:' : 'Items:'}</div>
                {order.items && order.items.map((item, index) => {
                  let colorStyle = '#ffffff'; 
                  let colorTextToShow = '';
                  if (item.selected_color) {
                    if (typeof item.selected_color === 'object') {
                      colorStyle = item.selected_color.color_code || item.selected_color.code || '#ffffff';
                      colorTextToShow = item.selected_color.color_name || colorStyle;
                    } else {
                      const colorStr = String(item.selected_color);
                      colorTextToShow = colorStr;
                      const currentProduct = products.find(p => p.name === item.product_name);
                      const matchedColorObj = currentProduct?.colors?.find(c => String(c.color_name) === colorStr);
                      if (matchedColorObj?.color_code) {
                        colorStyle = matchedColorObj.color_code;
                      } else if (/^[0-9A-F]{6}$/i.test(colorStr)) {
                        colorStyle = `#${colorStr}`;
                      } else {
                        colorStyle = colorStr; 
                      }
                    }
                  }
                  return (
                    <div key={index} className="flex flex-wrap items-center gap-1.5 text-xs text-stone-800 border-b border-stone-100 pb-2 last:border-0 last:pb-0 w-full">
                      <span className="font-semibold text-stone-900 break-words min-w-0 max-w-full">{item.product_name}</span>
                      <span className="text-brand-700 font-sans font-bold">({item.quantity}x)</span>
                      {item.selected_color ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="inline-block h-3.5 w-3.5 rounded-full border border-stone-300 shadow-xs" style={{ backgroundColor: colorStyle }} />
                          <span className="text-[10px] bg-white border border-stone-200 text-stone-600 px-1 rounded font-mono truncate max-w-[80px]">{colorTextToShow}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-400 italic shrink-0">{isAr ? 'بدون لون' : 'No color'}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-1 gap-2">
                <div className="min-w-0">
                  <span className="text-xs text-stone-500">{isAr ? 'الإجمالي: ' : 'Total: '}</span>
                  <span className="font-bold text-stone-900 font-mono truncate block sm:inline">{formatPrice(order.total, isAr)}</span>
                </div>
                <button className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 active:bg-rose-100 transition whitespace-nowrap shrink-0" type="button" onClick={() => deleteOrder(order.id)}>
                  {t.admin.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🛠️ باقي الحقول وأقسام المنتجات والتحكم مع معالجة الـ Overflow */}
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] w-full max-w-full">
        <section className="space-y-6 rounded-page border border-white/40 bg-white/80 p-4 sm:p-6 shadow-soft backdrop-blur-sm w-full max-w-full overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-stone-900">{t.admin.products}</h2>
            <button className="button-surface border border-brand-200 bg-white text-stone-700 whitespace-nowrap" type="button" onClick={resetProductForm}>{t.admin.newProduct}</button>
          </div>
          
          <fieldset className="rounded-2xl border border-brand-100 bg-sand-50/70 p-3 sm:p-4 w-full overflow-hidden">
            <legend className="px-2 text-sm font-semibold text-stone-700">{isAr ? 'بيانات المنتج' : 'Product details'}</legend>
            <div className="mt-4 grid gap-4 w-full">
              <label className="grid gap-2 text-sm font-semibold text-stone-700 w-full"><span>{isAr ? 'اسم المنتج' : 'Product name'}</span><input className="input-surface w-full" value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} /></label>
              <label className="grid gap-2 text-sm font-semibold text-stone-700 w-full"><span>{isAr ? 'القسم' : 'Category'}</span><select className="input-surface w-full" value={productForm.category} onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))}><option value="">{isAr ? 'اختر القسم' : 'Select category'}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="grid gap-2 text-sm font-semibold text-stone-700 w-full"><span>{isAr ? 'الوصف' : 'Description'}</span><textarea className="input-surface min-h-[110px] w-full" value={productForm.description} onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
              
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 w-full">
                <label className="grid gap-2 text-sm font-semibold text-stone-700 w-full"><span>{isAr ? 'السعر' : 'Price'}</span><input className="input-surface w-full" type="number" step="0.01" value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))} /></label>
                <label className="grid gap-2 text-sm font-semibold text-stone-700 w-full"><span>{isAr ? 'سعر التخفيض' : 'Sale price'}</span><input className="input-surface w-full" type="number" step="0.01" value={productForm.sale_price} onChange={(event) => setProductForm((prev) => ({ ...prev, sale_price: event.target.value }))} /></label>
                <label className="grid gap-2 text-sm font-semibold text-stone-700 w-full"><span>{isAr ? 'نشط' : 'Active'}</span><input className="h-11 rounded-2xl border border-brand-200 bg-white px-4" type="checkbox" checked={productForm.is_active} onChange={(event) => setProductForm((prev) => ({ ...prev, is_active: event.target.checked }))} /></label>
              </div>
              
              {/* تعديل حقل اختيار الملف الأساسي وإلغاء الـ w-max المسبب للمشاكل */}
              <label className="grid gap-2 text-sm font-semibold text-stone-700 w-full">
                <span>{isAr ? 'الصورة الأساسية' : 'Main Image'}</span>
                <input className="rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm w-full max-w-full" type="file" accept="image/*" onChange={(event) => setProductForm((prev) => ({ ...prev, imageFile: event.target.files?.[0] || null }))} />
                
                {productForm.currentImage && !productForm.imageFile && (
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-2 w-full sm:w-auto sm:inline-flex">
                    <img src={productForm.currentImage} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                    <span className="text-xs text-stone-500 break-words">{isAr ? 'الصورة الحالية على السيرفر' : 'Current main image'}</span>
                  </div>
                )}
                {productForm.imageFile && (
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/50 p-2 w-full sm:w-auto sm:inline-flex">
                    <img src={URL.createObjectURL(productForm.imageFile)} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                    <span className="text-xs text-brand-700 font-medium break-words">{isAr ? 'صورة جديدة (سيتم التحديث عند الحفظ)' : 'New image preview'}</span>
                  </div>
                )}
              </label>

              <div className="space-y-3 rounded-xl border border-brand-100 bg-white p-3 w-full">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-stone-700">{isAr ? 'الألوان المتاحة' : 'Available Colors'}</span>
                  <button type="button" onClick={addColorField} className="text-xs font-bold text-brand-600 underline whitespace-nowrap">{isAr ? '+ إضافة لون' : '+ Add Color'}</button>
                </div>
                {productColors.map((color, idx) => (
                  <div key={idx} className="flex items-center gap-2 w-full">
                    <input type="text" placeholder={isAr ? "اسم اللون" : "Color Name"} className="input-surface text-xs flex-1 min-w-0 w-full" value={color.color_name} onChange={(e) => updateColorField(idx, 'color_name', e.target.value)} />
                    <input type="color" className="h-10 w-12 cursor-pointer rounded-lg border-none p-0 shrink-0" value={color.color_code} onChange={(e) => updateColorField(idx, 'color_code', e.target.value)} />
                    <button type="button" onClick={() => removeColorField(idx)} className="text-rose-500 font-bold px-1 text-lg shrink-0">×</button>
                  </div>
                ))}
              </div>

              {/* 📸 قسم الصور الإضافية المطور لمنع اتساع الشاشة أفقياً */}
              <div className="space-y-3 w-full">
                <label className="grid gap-2 text-sm font-semibold text-stone-700 w-full">
                  <span>{isAr ? 'إضافة صور إضافية جديدة' : 'Add Additional Images'}</span>
                  <input className="rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm w-full max-w-full" type="file" accept="image/*" multiple onChange={(event) => setAdditionalImages([...additionalImages, ...Array.from(event.target.files || [])])} />
                </label>

                {/* كروت المعاينة تفتح عمودين عالموبايل لمنع الحشر والتمدد */}
                {additionalImageUrls.length > 0 && (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 w-full">
                    <p className="text-xs font-bold text-stone-600 mb-2 break-words">{isAr ? 'الصور الإضافية الحالية في المعرض (اضغط × للمسح):' : 'Current Gallery Images (Click × to remove):'}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                      {additionalImageUrls.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-stone-200 group w-full">
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          <button type="button" onClick={() => setAdditionalImageUrls(additionalImageUrls.filter((_, i) => i !== idx))} className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-md hover:bg-rose-700 transition">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {additionalImages.length > 0 && (
                  <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-3 w-full">
                    <p className="text-xs font-bold text-brand-700 mb-2 break-words">{isAr ? 'صور جديدة تم اختيارها (سيتم حفظها):' : 'New selected images (will be saved):'}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                      {additionalImages.map((file, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-brand-200 w-full">
                          <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                          <button type="button" onClick={() => setAdditionalImages(additionalImages.filter((_, i) => i !== idx))} className="absolute top-1.5 right-1.5 bg-stone-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-md hover:bg-stone-950 transition">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2"><button className="button-surface bg-stone-900 text-white w-full sm:w-auto" type="button" onClick={handleProductSubmit}>{productForm.id ? t.admin.updateProduct : t.admin.saveProduct}</button></div>
            </div>
          </fieldset>

          {/* تغليف جداول الـ Desktop المتبقية بـ overflow معزول لحماية المحاذاة */}
          <div className="overflow-x-auto w-full rounded-2xl border border-brand-100">
            <table className="min-w-full border-collapse text-sm table-auto">
              <thead className="bg-sand-50 text-left text-xs uppercase tracking-[0.2em] text-stone-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Actions</th></tr></thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-brand-100 transition hover:bg-stone-50">
                    <td className="px-4 py-3 font-semibold text-stone-900 whitespace-nowrap">{product.name}</td>
                    <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{product.category_name || (isAr ? 'بدون قسم' : 'No category')}</td>
                    <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{product.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}</td>
                    <td className="px-4 py-3 font-semibold text-stone-900 whitespace-nowrap">{formatPrice(product.sale_price || product.price, isAr)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="button-surface border border-brand-200 bg-white text-stone-700 whitespace-nowrap"
                          type="button"
                          onClick={() => {
                            setProductForm({
                              id: product.id,
                              category: product.category || '',
                              name: product.name || '',
                              description: product.description || '',
                              price: product.price || '',
                              sale_price: product.sale_price || '',
                              imageFile: null,
                              is_active: product.is_active,
                              currentImage: product.image || product.image_url || '',
                            })
                            setProductColors(Array.isArray(product.colors) ? product.colors.map((color) => ({
                              color_name: color.color_name || '',
                              color_code: color.color_code || '#000000',
                            })) : [])
                            setAdditionalImageUrls(Array.isArray(product.additional_images) ? product.additional_images
                              .map((image) => image?.image || image?.image_url || image)
                              .filter(Boolean) : [])
                            setAdditionalImages([])
                          }}
                        >
                          {t.admin.edit}
                        </button>
                        <button className="button-surface border border-rose-200 bg-white text-rose-600 whitespace-nowrap" type="button" onClick={() => setDeleteTarget({ type: 'product', id: product.id })}>{t.admin.delete}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6 w-full max-w-full">
          <section className="space-y-6 rounded-page border border-white/40 bg-white/80 p-4 sm:p-6 shadow-soft backdrop-blur-sm w-full max-w-full overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-stone-900">{t.admin.categories}</h2>
              <button className="button-surface border border-brand-200 bg-white text-stone-700 whitespace-nowrap" type="button" onClick={resetCategoryForm}>{t.admin.newCategory}</button>
            </div>
            
            <fieldset className="rounded-2xl border border-brand-100 bg-sand-50/70 p-4 w-full">
              <legend className="px-2 text-sm font-semibold text-stone-700">{isAr ? 'بيانات القسم' : 'Category details'}</legend>
              <label className="mt-4 grid gap-2 text-sm font-semibold text-stone-700 w-full"><span>{isAr ? 'اسم القسم' : 'Category name'}</span><input className="input-surface w-full" value={categoryForm.name} onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))} /></label>
              <button className="mt-4 button-surface bg-stone-900 text-white w-full sm:w-auto" type="button" onClick={handleCategorySubmit}>{categoryForm.id ? t.admin.updateCategory : t.admin.saveCategory}</button>
            </fieldset>
            
            <div className="overflow-x-auto w-full rounded-2xl border border-brand-100">
              <table className="min-w-full border-collapse text-sm table-auto">
                <thead className="bg-sand-50 text-left text-xs uppercase tracking-[0.2em] text-stone-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Actions</th></tr></thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-t border-brand-100 transition hover:bg-stone-50">
                      <td className="px-4 py-3 font-semibold text-stone-900 whitespace-nowrap">{category.name}</td>
                      <td className="px-4 py-3"><div className="flex gap-2"><button className="button-surface border border-brand-200 bg-white text-stone-700 whitespace-nowrap" type="button" onClick={() => setCategoryForm({ id: category.id, name: category.name })}>{t.admin.edit}</button><button className="button-surface border border-rose-200 bg-white text-rose-600 whitespace-nowrap" type="button" onClick={() => setDeleteTarget({ type: 'category', id: category.id })}>{t.admin.delete}</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4 rounded-page border border-white/40 bg-white/80 p-4 sm:p-6 shadow-soft backdrop-blur-sm w-full max-w-full overflow-hidden">
            <h2 className="font-display text-2xl text-stone-900">{t.admin.users}</h2>
            <div className="overflow-x-auto w-full rounded-2xl border border-brand-100">
              <table className="min-w-full border-collapse text-sm table-auto">
                <thead className="bg-sand-50 text-left text-xs uppercase tracking-[0.2em] text-stone-500"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Actions</th></tr></thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-brand-100 transition hover:bg-stone-50">
                      <td className="px-4 py-3 font-semibold text-stone-900 whitespace-nowrap">{user.username}</td>
                      <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{user.is_staff ? (isAr ? 'أدمن' : 'Admin') : (isAr ? 'عميل' : 'Customer')}</td>
                      <td className="px-4 py-3"><button className="button-surface border border-brand-200 bg-white text-stone-700 whitespace-nowrap" type="button" onClick={() => handleToggleAdmin(user)}>{user.is_staff ? (isAr ? 'إزالة الأدمن' : 'Remove admin') : (isAr ? 'ترقية لأدمن' : 'Make admin')}</button></td>
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