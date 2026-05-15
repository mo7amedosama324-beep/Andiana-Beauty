import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import ProductGrid from '../components/ProductGrid'
import ScrollReveal from '../components/ScrollReveal'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'

export default function HomePage() {
  const { isAr, setLang, t, products, productsLoading, productsError, categories, categoriesLoading, categoriesError, apiOrigin, authUser, handleLogout, cartItemCount, addToCart, cartBusy, nudePalette, togglePalette } = useApp()
  const { pushToast } = useToast()
  const activeProducts = products.filter((product) => product.is_active !== false)
  const featuredProducts = activeProducts.slice(0, 8)
  const handleAddToCart = useCallback(async (productId) => {
    await addToCart(productId)
    pushToast({ type: 'success', message: isAr ? 'تمت الإضافة إلى السلة.' : 'Added to bag.' })
  }, [addToCart, isAr, pushToast])

  return (
    <PageShell isAr={isAr} setLang={setLang} t={t} authUser={authUser} onLogout={handleLogout} cartCount={cartItemCount} nudePalette={nudePalette} onTogglePalette={togglePalette}>
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <ScrollReveal hero>
          <article className="relative overflow-hidden rounded-page border border-white/40 bg-gradient-to-br from-rose-100/50 via-amber-50/50 to-white p-6 shadow-elevated sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">{t.home.heroEyebrow}</p>
            <h1 className="mt-3 font-display text-3xl text-stone-900 sm:text-5xl">{t.home.heroTitle}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">{t.home.heroBody}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="button-surface bg-stone-900 text-white" to="/shop">{t.home.ctaPrimary}</Link>
              <Link className="button-surface border border-brand-200 bg-white text-stone-700" to="/about">{t.home.ctaSecondary}</Link>
            </div>
          </article>
        </ScrollReveal>

        <ScrollReveal>
          <article className="card-surface p-6">
            <h2 className="font-display text-2xl text-stone-900">{t.home.whyTitle}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
              {t.home.why.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </article>
        </ScrollReveal>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl text-stone-900">{t.home.categoriesTitle}</h2>
          <p className="text-sm text-stone-500">{t.home.categoriesBody}</p>
        </div>
        {categoriesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-card bg-stone-200/80" />)}
          </div>
        ) : categoriesError ? (
          <p className="rounded-card border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{categoriesError}</p>
        ) : categories.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <article key={category.id} className="card-surface p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white hover:shadow-elevated">
                <p className="text-sm font-semibold text-stone-900">{category.name}</p>
                <p className="mt-1 text-xs text-stone-500">{isAr ? 'قسم رئيسي' : 'Core category'}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-card border border-brand-100 bg-white/80 px-4 py-3 text-sm text-stone-500">{t.home.noCategories}</p>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-stone-900">{t.home.featuredTitle}</h2>
            <p className="text-sm text-stone-500">{t.home.featuredBody}</p>
          </div>
          <Link className="text-xs font-semibold text-stone-700 underline-offset-4 hover:underline" to="/shop">{t.home.viewAll}</Link>
        </div>
        {productsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="animate-pulse rounded-card border border-brand-100 bg-white/80 p-4"><div className="h-36 rounded-2xl bg-stone-200/80" /><div className="mt-4 h-4 w-3/4 rounded-full bg-stone-200/80" /><div className="mt-2 h-3 w-1/2 rounded-full bg-stone-200/80" /></div>)}
          </div>
        ) : productsError ? (
          <p className="rounded-card border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{productsError}</p>
        ) : featuredProducts.length ? (
          <ProductGrid
            products={featuredProducts}
            isAr={isAr}
            apiOrigin={apiOrigin}
            addLabel={t.deals?.add || 'Add to bag'}
            onAddToCart={handleAddToCart}
            cartBusy={cartBusy}
          />
        ) : (
          <p className="rounded-card border border-brand-100 bg-white/80 px-4 py-3 text-sm text-stone-500">{t.home.noProducts}</p>
        )}
      </section>
    </PageShell>
  )
}
