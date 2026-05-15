import { memo, useState } from 'react'
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
            {product.colors.map((color) => (
              <button
                key={color.id}
                type="button"
                title={color.color_name}
                onClick={() => setSelectedColor(color.id)}
                className={`h-6 w-6 rounded-full border-2 transition-all shadow-sm ${
                  selectedColor === color.id ? 'border-stone-900 scale-110' : 'border-stone-200 hover:scale-110'
                }`}
                style={{ backgroundColor: color.color_code }}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
          <span>{formatPrice(product.sale_price || product.price, isAr)}</span>
          {product.sale_price ? <span className="text-xs text-stone-400 line-through">{formatPrice(product.price, isAr)}</span> : null}
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