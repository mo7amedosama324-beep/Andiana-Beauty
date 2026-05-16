import { memo, useMemo, useState } from 'react'
import { formatPrice } from '../lib/formatters' // شيلنا resolveImage لأن رابط الكلاوديناري بيجي جاهز

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
  
  // State 1: عشان الصورة اللي معروضة تتغير لما ندوس على الصور الصغيرة
  const [mainImage, setMainImage] = useState(product.image)
  
  // State 2: عشان نحفظ اللون اللي اليوزر اختاره
  const [selectedColor, setSelectedColor] = useState(null)
  
  // حساب نسبة الخصم
  const discountPercentage = useMemo(() => {
    if (product.sale_price && product.price) {
      const discount = ((parseFloat(product.price) - parseFloat(product.sale_price)) / parseFloat(product.price)) * 100
      return Math.round(discount)
    }
    return 0
  }, [product.price, product.sale_price])

  return (
    <article className="group card-surface overflow-hidden p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white hover:shadow-elevated">
      
      {/* الصورة الأساسية */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-rose-100/50 via-amber-50/50 to-white">
        {!hasImageError && mainImage ? (
          <img
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            src={mainImage}
            alt={product.name}
            loading="lazy"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose-100/60 via-amber-50/60 to-white" />
        )}

        {/* شارة Sale */}
        {discountPercentage > 0 && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            {discountPercentage}% OFF
          </div>
        )}

        {/* Overlay عند Hover مع أزرار سريعة */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            type="button"
            disabled={cartBusy || !onAddToCart}
            onClick={() => onAddToCart?.(product.id, selectedColor)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-stone-900 shadow-lg transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
            title={isAr ? 'إضافة للسلة' : 'Add to cart'}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-stone-900 shadow-lg transition-transform hover:scale-110"
            title={isAr ? 'معاينة' : 'Quick view'}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* معرض الصور الصغير (Gallery) - هيظهر بس لو فيه صور إضافية */}
      {product.additional_images && product.additional_images.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {/* بنعرض الصورة الأساسية كأول صورة صغيرة عشان يقدر يرجعلها */}
          <button
            type="button"
            onClick={() => setMainImage(product.image)}
            className={`h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
              mainImage === product.image ? 'border-stone-900' : 'border-transparent'
            }`}
          >
            <img src={product.image} alt="main thumbnail" className="h-full w-full object-cover" />
          </button>
          
          {/* بنلف على باقي الصور الإضافية */}
          {product.additional_images.map((imgObj) => (
            <button
              key={imgObj.id}
              type="button"
              onClick={() => setMainImage(imgObj.image)}
              className={`h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                mainImage === imgObj.image ? 'border-stone-900' : 'border-transparent'
              }`}
            >
              <img src={imgObj.image} alt="thumbnail" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div>
          <p className="text-sm font-semibold text-stone-900">{product.name}</p>
          {product.category_name ? <p className="text-xs text-stone-500">{product.category_name}</p> : null}
        </div>

        {/* دوائر الألوان - هتظهر بس لو المنتج ليه ألوان */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 pb-1">
            {product.colors.map((color, index) => (
              <button
                key={index}
                type="button"
                title={color.color_name}
                onClick={() => setSelectedColor(index)}
                className={`h-7 w-7 rounded-full border-2 transition-all shadow-sm hover:scale-110 ${
                  selectedColor === index ? 'border-stone-900 scale-110 ring-2 ring-stone-200' : 'border-stone-200'
                }`}
                style={{ backgroundColor: color.color_code }}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {product.sale_price ? (
            <>
              <span className="text-lg font-bold text-stone-900">{formatPrice(product.sale_price, isAr)}</span>
              <span className="text-sm text-stone-400 line-through">{formatPrice(product.price, isAr)}</span>
            </>
          ) : (
            <span className="text-lg font-bold text-stone-900">{formatPrice(product.price, isAr)}</span>
          )}
        </div>

        <button
          type="button"
          disabled={cartBusy || !onAddToCart}
          // ممكن نبعت اللون اللي اختاره للسلة بعدين لو حبيت
          onClick={() => onAddToCart?.(product.id, selectedColor)}
          className="button-surface mt-2 w-full bg-stone-900 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {addLabel}
        </button>
      </div>
    </article>
  )
}

export default ProductGrid