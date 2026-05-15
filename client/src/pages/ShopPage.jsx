import { useCallback, useMemo, useState } from 'react'
import PageShell from '../components/PageShell'
import ProductGrid from '../components/ProductGrid'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'

export default function ShopPage() {
  const { isAr, setLang, t, products, productsLoading, productsError, categories, categoriesLoading, categoriesError, apiOrigin, authUser, handleLogout, cartItemCount, addToCart, cartBusy, nudePalette, togglePalette } = useApp()
  const [activeCategory, setActiveCategory] = useState('all')
  const { pushToast } = useToast()
  const handleAddToCart = useCallback(async (productId) => {
    await addToCart(productId)
    pushToast({ type: 'success', message: isAr ? 'تمت الإضافة إلى السلة.' : 'Added to bag.' })
  }, [addToCart, isAr, pushToast])

  const activeProducts = useMemo(() => products.filter((product) => product.is_active !== false), [products])
  const filteredProducts = useMemo(() => (
    activeCategory === 'all' ? activeProducts : activeProducts.filter((product) => String(product.category) === String(activeCategory))
  ), [activeCategory, activeProducts])

  return (
    <PageShell isAr={isAr} setLang={setLang} t={t} authUser={authUser} onLogout={handleLogout} cartCount={cartItemCount} nudePalette={nudePalette} onTogglePalette={togglePalette}>
      <section className="space-y-4">
        <div>
          <h1 className="font-display text-3xl text-stone-900">{t.shop.title}</h1>
          <p className="text-sm text-stone-500">{t.shop.body}</p>
        </div>
        {categoriesLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-9 w-20 animate-pulse rounded-full bg-stone-200/80" />)}
          </div>
        ) : categoriesError ? (
          <p className="rounded-card border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{categoriesError}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button className={`button-surface border ${activeCategory === 'all' ? 'border-stone-900 bg-stone-900 text-white' : 'border-brand-200 bg-white text-stone-700'}`} type="button" onClick={() => setActiveCategory('all')}>{t.shop.all}</button>
            {categories.map((category) => (
              <button key={category.id} className={`button-surface border ${String(activeCategory) === String(category.id) ? 'border-stone-900 bg-stone-900 text-white' : 'border-brand-200 bg-white text-stone-700'}`} type="button" onClick={() => setActiveCategory(category.id)}>
                {category.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {productsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <div key={index} className="animate-pulse rounded-card border border-brand-100 bg-white/80 p-4"><div className="h-36 rounded-2xl bg-stone-200/80" /><div className="mt-4 h-4 w-3/4 rounded-full bg-stone-200/80" /></div>)}
        </div>
      ) : productsError ? (
        <p className="rounded-card border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{productsError}</p>
      ) : filteredProducts.length ? (
        <ProductGrid
          products={filteredProducts}
          isAr={isAr}
          apiOrigin={apiOrigin}
          addLabel={t.deals?.add || 'Add to bag'}
            onAddToCart={handleAddToCart}
          cartBusy={cartBusy}
        />
      ) : (
        <p className="rounded-card border border-brand-100 bg-white/80 px-4 py-3 text-sm text-stone-500">{t.shop.empty}</p>
      )}
    </PageShell>
  )
}
