import { memo, useMemo, useState } from 'react'
import { formatPrice } from '../lib/formatters'

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

function ProductCard({ product, isAr, addLabel, onAddToCart, cartBusy }) {
  const [hasImageError, setHasImageError] = useState(false)
  const [mainImage, setMainImage] = useState(product.image)
  const [selectedColor, setSelectedColor] = useState(null)
  
  const discountPercentage = useMemo(() => {
    if (product.sale_price && product.price) {
      const discount = ((parseFloat(product.price) - parseFloat(product.sale_price)) / parseFloat(product.price)) * 100
      return Math.round(discount)
    }
    return 0
  }, [product.price, product.sale_price])

  return (
    <article className="group card-surface relative flex flex-col overflow-hidden p-3 transition-all duration-300 hover:-translate-y-1 dark:bg-zinc-900/40 dark:border-zinc-800">
      
      {/* الصورة الأساسية */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        {!hasImageError && mainImage ? (
          <img
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
            src={mainImage}
            alt={product.name}
            loading="lazy"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-400">
            No Image
          </div>
        )}

        {/* شارة الخصم */}
        {discountPercentage > 0 && (
          <div className="absolute left-2 top-2 z-10 rounded-full bg-rose-600 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
            -{discountPercentage}%
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
          <button
            onClick={() => onAddToCart?.(product.id, selectedColor)}
            disabled={cartBusy}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-900 shadow-xl transition-transform hover:scale-110 active:scale-90 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </button>
        </div>
      </div>

      {/* معرض الصور الصغير (Gallery) */}
      {product.additional_images && product.additional_images.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/* الصورة الأساسية في المصغرات */}
          <button
            onClick={() => setMainImage(product.image)}
            className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
              mainImage === product.image ? 'border-brand-500 ring-2 ring-brand-200' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <img src={product.image} className="h-full w-full object-cover" alt="thumb" />
          </button>
          
          {/* الصور الإضافية */}
          {product.additional_images.map((imgObj) => (
            <button
              key={imgObj.id}
              onClick={() => setMainImage(imgObj.image)}
              className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                mainImage === imgObj.image ? 'border-brand-500 ring-2 ring-brand-200' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={imgObj.image} className="h-full w-full object-cover" alt="thumb" />
            </button>
          ))}
        </div>
      )}

      {/* تفاصيل المنتج */}
      <div className="mt-4 flex flex-col flex-grow space-y-2">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
            {product.name}
          </h3>
          {product.category_name && (
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {product.category_name}
            </p>
          )}
        </div>

        {/* اختيار الألوان */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1">
            {product.colors.map((color, index) => (
              <button
                key={index}
                title={color.color_name}
                onClick={() => setSelectedColor(index)}
                className={`h-5 w-5 rounded-full border transition-all ${
                  selectedColor === index ? 'ring-2 ring-brand-400 ring-offset-2 dark:ring-offset-zinc-900 border-transparent' : 'border-zinc-200 dark:border-zinc-700'
                }`}
                style={{ backgroundColor: color.color_code }}
              />
            ))}
          </div>
        )}

        {/* السعر */}
        <div className="flex items-center gap-2">
          {product.sale_price ? (
            <>
              <span className="text-base font-black text-brand-600 dark:text-brand-400">
                {formatPrice(product.sale_price, isAr)}
              </span>
              <span className="text-xs text-zinc-400 line-through">
                {formatPrice(product.price, isAr)}
              </span>
            </>
          ) : (
            <span className="text-base font-black text-zinc-900 dark:text-zinc-100">
              {formatPrice(product.price, isAr)}
            </span>
          )}
        </div>

        {/* زر الإضافة للسلة السفلي */}
        <button
          disabled={cartBusy}
          onClick={() => onAddToCart?.(product.id, selectedColor)}
          className="mt-auto w-full rounded-xl bg-zinc-900 py-2.5 text-xs font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-brand-500 dark:text-zinc-950 dark:hover:bg-brand-400 disabled:opacity-50"
        >
          {cartBusy ? '...' : addLabel}
        </button>
      </div>
    </article>
  )
}

export default ProductGrid