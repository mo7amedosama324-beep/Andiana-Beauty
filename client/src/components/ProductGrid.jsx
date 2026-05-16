import { memo, useMemo, useState } from 'react'
import { formatPrice } from '../lib/formatters'

// --- كومبوننت الـ Grid الأساسي ---
const ProductGrid = memo(function ProductGrid({ products, isAr, apiOrigin, addLabel, onAddToCart, cartBusy }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

// --- كومبوننت كارت المنتج "الشيك" الجديد ---
function ProductCard({ product, isAr, addLabel, onAddToCart, cartBusy }) {
  const [hasImageError, setHasImageError] = useState(false)
  
  // State للصورة المعروضة حالياً (الكبيرة)
  const [currentImage, setCurrentImage] = useState(product.image)
  
  // تجميع كل الصور (الأساسية + الإضافية) في مصفوفة واحدة للـ Gallery
  const allProductImages = useMemo(() => {
    const images = [product.image];
    if (product.additional_images && product.additional_images.length > 0) {
      product.additional_images.forEach(imgObj => images.push(imgObj.image));
    }
    // بناخد أول 4 صور بس عشان الشكل يفضل متناسق
    return images.slice(0, 4);
  }, [product.image, product.additional_images]);

  // حساب نسبة الخصم
  const discountPercentage = useMemo(() => {
    if (product.sale_price && product.price) {
      const discount = ((parseFloat(product.price) - parseFloat(product.sale_price)) / parseFloat(product.price)) * 100
      return Math.round(discount)
    }
    return 0
  }, [product.price, product.sale_price])

  return (
    <article className="group card-surface flex flex-col overflow-hidden p-3.5 transition-all duration-300 hover:-translate-y-1 dark:bg-zinc-950 dark:border-zinc-800">
      
      {/* --- منطقة الصورة (Image & Thumbnail Gallery) --- */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        
        {/* الصورة الكبيرة المعروضة */}
        {!hasImageError && currentImage ? (
          <img
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
            src={currentImage}
            alt={product.name}
            loading="lazy"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}

        {/* شارة Sale */}
        {discountPercentage > 0 && (
          <div className="absolute left-3 top-3 z-20 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-black uppercase text-white shadow-lg">
            {isAr ? 'خصم' : 'Sale'}
          </div>
        )}

        {/* --- الـ Hover Gallery: صور مصغرة عمودية شيك تظهر عند الهوفر --- */}
        {allProductImages.length > 1 && (
          <div className="absolute right-2 top-0 bottom-0 z-20 flex flex-col justify-center gap-1.5 py-4 transition-opacity duration-300 group-hover:opacity-100 opacity-60">
            {allProductImages.map((imgUrl, index) => (
              <button
                key={index}
                type="button"
                // السحر هنا: لما تمشي الماوس (OnMouseEnter)، الصورة الكبيرة بتتغير
                onMouseEnter={() => setCurrentImage(imgUrl)}
                className={`h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-white transition-all duration-150 active:scale-95 ${
                  currentImage === imgUrl 
                    ? 'border-brand-500 ring-2 ring-brand-200 shadow-elevated' 
                    : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 shadow-sm'
                }`}
              >
                <img src={imgUrl} className="h-full w-full object-cover" alt={`thumbnail ${index + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- منطقة تفاصيل المنتج (Price, Name, CTA) --- */}
      <div className="mt-5 flex flex-col flex-grow space-y-3.5">
        
        {/* الاسم والقسم */}
        <div>
          <h3 className="text-sm font-bold leading-tight text-zinc-950 dark:text-zinc-50 line-clamp-1 group-hover:text-brand-700 transition-colors">
            {product.name}
          </h3>
          {product.category_name && (
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-1">
              {product.category_name}
            </p>
          )}
        </div>

        {/* اختيار الألوان (إذا وجد) */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1">
            {product.colors.map((color, index) => (
              <span
                key={index}
                title={color.color_name}
                className="h-5 w-5 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-inner"
                style={{ backgroundColor: color.color_code }}
              />
            ))}
          </div>
        )}

        {/* السعر و زر الإضافة (جنب بعض عشان نوفر مساحة) */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          {/* منطقة السعر */}
          <div className="flex flex-col items-start gap-0.5">
            {product.sale_price ? (
              <>
                <span className="text-base font-black text-brand-700 dark:text-brand-400">
                  {formatPrice(product.sale_price, isAr)}
                </span>
                <span className="text-xs text-zinc-400 line-through">
                  {formatPrice(product.price, isAr)}
                </span>
              </>
            ) : (
              <span className="text-base font-black text-zinc-950 dark:text-zinc-50">
                {formatPrice(product.price, isAr)}
              </span>
            )}
          </div>

          {/* زر الإضافة للسلة - شيك وصغير */}
          <button
            type="button"
            disabled={cartBusy || !onAddToCart}
            onClick={() => onAddToCart?.(product.id)}
            className="flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-5 text-xs font-bold text-white shadow-elevated transition-all hover:bg-zinc-800 active:scale-95 dark:bg-brand-500 dark:text-zinc-950 dark:hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cartBusy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              addLabel
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductGrid