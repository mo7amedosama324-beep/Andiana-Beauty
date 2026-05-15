import { memo, useState } from 'react'
import { formatPrice, resolveImage } from '../lib/formatters'

const ProductGrid = memo(function ProductGrid({ products, isAr, apiOrigin, addLabel, onAddToCart, cartBusy }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isAr={isAr}
          apiOrigin={apiOrigin}
          addLabel={addLabel}
          onAddToCart={onAddToCart}
          cartBusy={cartBusy}
        />
      ))}
    </div>
  )
})

function ProductCard({ product, isAr, apiOrigin, addLabel, onAddToCart, cartBusy }) {
  const [hasImageError, setHasImageError] = useState(false)
  const imageSrc = resolveImage(product.image || product.image_url, apiOrigin)

  return (
    <article className="group card-surface overflow-hidden p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white hover:shadow-elevated">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-rose-100/50 via-amber-50/50 to-white">
        {!hasImageError && imageSrc ? (
          <img
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose-100/60 via-amber-50/60 to-white" />
        )}
      </div>
      <div className="mt-4 space-y-2">
        <div>
          <p className="text-sm font-semibold text-stone-900">{product.name}</p>
          {product.category_name ? <p className="text-xs text-stone-500">{product.category_name}</p> : null}
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
          <span>{formatPrice(product.sale_price || product.price, isAr)}</span>
          {product.sale_price ? <span className="text-xs text-stone-400 line-through">{formatPrice(product.price, isAr)}</span> : null}
        </div>
        <button
          type="button"
          disabled={cartBusy || !onAddToCart}
          onClick={() => onAddToCart?.(product.id)}
          className="button-surface mt-2 w-full bg-stone-900 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {addLabel}
        </button>
      </div>
    </article>
  )
}

export default ProductGrid
