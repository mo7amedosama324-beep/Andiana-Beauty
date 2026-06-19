import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Stepper from '../components/Stepper'
import { formatPrice, resolveImage } from '../lib/formatters'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'

export default function CartPage() {
  const {
    isAr, setLang, t, apiOrigin, authUser, handleLogout,
    cart, refreshCart, updateCartLineQuantity, removeCartLine,
    checkout, cartBusy, cartItemCount, nudePalette, togglePalette, products
  } = useApp()

  const { pushToast } = useToast()
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_address: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [doneOrder, setDoneOrder] = useState(null)

  useEffect(() => { refreshCart() }, [refreshCart])

  const lines = cart?.items ?? []
  const totalLabel = useMemo(() => (cart?.total != null ? formatPrice(cart.total, isAr) : formatPrice(0, isAr)), [cart, isAr])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!lines.length) return
    setSubmitting(true)
    try {
      const order = await checkout({
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_address: form.customer_address.trim(),
      })
      setDoneOrder(order)
      pushToast({ type: 'success', message: isAr ? 'تم إرسال الطلب بنجاح.' : 'Order placed successfully.' })
    } catch (err) {
      setError(err.message || 'Error')
      pushToast({ type: 'error', message: err.message || (isAr ? 'حدث خطأ.' : 'Something went wrong.') })
    } finally {
      setSubmitting(false)
    }
  }

  // دالة تغيير اللون من جوه السلة
  const handleColorChange = async (line, newColor) => {
    if (!newColor || newColor === line.selected_color || cartBusy) return;
    await removeCartLine(line.id);
    await updateCartLineQuantity(line.product.id, line.quantity, newColor);
  };

  // دالة معالجة تحديث الكمية لمنع الضرب في 2
  const handleQtyUpdate = async (e, productId, newQty, selectedColor) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartBusy || !productId || newQty < 1) return;
    await updateCartLineQuantity(productId, Number(newQty), selectedColor || '');
  };

  if (doneOrder) {
    return (
      <PageShell isAr={isAr} setLang={setLang} t={t} authUser={authUser} onLogout={handleLogout} cartCount={0} nudePalette={nudePalette} onTogglePalette={togglePalette}>
        <Stepper steps={[t.cartPage.step1, t.cartPage.step2, t.cartPage.step3]} activeStep={3} />
        <section className="card-surface mx-auto max-w-2xl px-6 py-10 text-center">
          <p className="font-display text-2xl text-stone-900">{t.cartPage.thankYou}</p>
          <p className="mt-2 text-sm text-stone-600">{t.cartPage.orderId}{doneOrder.id}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link className="button-surface bg-stone-900 text-white" to="/shop">{t.cartPage.shopCta}</Link>
            <Link className="button-surface border border-brand-200 bg-white text-stone-700" to="/">{isAr ? 'تتبع الطلب' : 'Track order'}</Link>
          </div>
        </section>
      </PageShell>
    )
  }

  return (
    <PageShell isAr={isAr} setLang={setLang} t={t} authUser={authUser} onLogout={handleLogout} cartCount={cartItemCount} nudePalette={nudePalette} onTogglePalette={togglePalette}>
      <Stepper steps={[t.cartPage.step1, t.cartPage.step2, t.cartPage.step3]} activeStep={1} />

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-4 rounded-page border border-white/40 bg-white/80 p-6 shadow-soft backdrop-blur-sm">
          <div>
            <h1 className="font-display text-3xl text-stone-900">{t.cartPage.title}</h1>
            <p className="mt-1 text-sm text-stone-500">{t.cartPage.guestNote}</p>
          </div>
          {!lines.length ? (
            <div className="rounded-card border border-dashed border-brand-100 bg-sand-50 px-4 py-10 text-center">
              <p className="text-stone-600">{t.cartPage.empty}</p>
              <Link className="mt-4 inline-flex button-surface bg-stone-900 text-white" to="/shop">{t.cartPage.shopCta}</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {lines.map((line) => {
                const image = resolveImage(line.product?.image || line.product?.image_url, apiOrigin)
                const pid = line.product?.id
                const fullProduct = products.find(p => p.id === pid)

                return (
                  <article key={line.id} className="flex flex-wrap items-center gap-4 rounded-card border border-brand-100 bg-white/90 px-4 py-4 shadow-sm transition-all duration-300 ease-out hover:bg-white hover:shadow-elevated">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-100/50 via-amber-50/50 to-white">
                      {image ? <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-900">{line.product?.name}</p>

                      {/* دوائر الألوان */}
                      {fullProduct?.colors && fullProduct.colors.length > 0 && (
                        <div className="my-2 flex flex-wrap gap-1.5">
                          {fullProduct.colors.map((color, idx) => {
                            const isSelected = line.selected_color === color.color_name || line.selected_color === String(idx);

                            return (
                              <button
                                key={idx}
                                type="button"
                                title={color.color_name}
                                disabled={cartBusy}
                                onClick={() => handleColorChange(line, color.color_name)}
                                className={`h-6 w-6 rounded-full border transition-all ${isSelected
                                    ? 'ring-2 ring-brand-500 ring-offset-2 border-transparent scale-110 shadow-md'
                                    : 'border-zinc-300 dark:border-zinc-600 opacity-80 hover:opacity-100'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                style={{ backgroundColor: color.color_code }}
                              />
                            )
                          })}
                        </div>
                      )}

                      <p className="text-xs text-stone-500">{formatPrice(line.unit_price, isAr)} × {line.quantity}</p>
                    </div>

                    {/* أزرار التحكم بالكمية المحدثة */}
                    <div className="flex items-center gap-2">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-200 bg-white text-stone-700 transition-all duration-300 ease-out active:scale-95 disabled:opacity-50"
                        type="button"
                        disabled={cartBusy || line.quantity <= 1 || !pid}
                        onClick={(e) => handleQtyUpdate(e, pid, line.quantity - 1, line.selected_color)}
                      >
                        <span className="pointer-events-none">-</span>
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-semibold select-none">{line.quantity}</span>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-200 bg-white text-stone-700 transition-all duration-300 ease-out active:scale-95 disabled:opacity-50"
                        type="button"
                        disabled={cartBusy || !pid}
                        onClick={(e) => handleQtyUpdate(e, pid, line.quantity + 1, line.selected_color)}
                      >
                        <span className="pointer-events-none">+</span>
                      </button>
                      <button
                        className="text-xs font-semibold text-rose-600 underline-offset-4 hover:underline disabled:opacity-50"
                        type="button"
                        disabled={cartBusy}
                        onClick={() => removeCartLine(line.id)}
                      >
                        {t.cartPage.remove}
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-stone-900">{formatPrice(line.line_total, isAr)}</p>
                  </article>
                )
              })}
              <div className="flex justify-between border-t border-brand-100 pt-4 text-sm font-semibold text-stone-900">
                <span>{t.cartPage.total}</span>
                <span>{totalLabel}</span>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-page border border-white/40 bg-white/80 p-6 shadow-soft backdrop-blur-sm">
          <h2 className="font-display text-2xl text-stone-900">{t.cartPage.checkoutTitle}</h2>
          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              <span>{t.cartPage.name}</span>
              <input className="input-surface" required value={form.customer_name} onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              <span>{t.cartPage.phone}</span>
              <input className="input-surface" required value={form.customer_phone} onChange={(e) => setForm((prev) => ({ ...prev, customer_phone: e.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              <span>{t.cartPage.address}</span>
              <textarea className="input-surface min-h-[120px]" required rows={4} value={form.customer_address} onChange={(e) => setForm((prev) => ({ ...prev, customer_address: e.target.value }))} />
            </label>
            {error ? <p className="text-xs text-rose-600">{error}</p> : null}
            <button type="submit" disabled={submitting || cartBusy || !lines.length} className="button-surface bg-stone-900 text-white disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? t.cartPage.placing : t.cartPage.placeOrder}
            </button>
          </form>
        </section>
      </div>
    </PageShell>
  )
}