import { memo, useMemo, useState } from 'react'
import { formatPrice } from '../lib/formatters'

const ProductGrid = memo(function ProductGrid({ products, isAr, apiOrigin, addLabel, onAddToCart, cartBusy }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
  const [imageErrors, setImageErrors] = useState({})
  const [selectedColor, setSelectedColor] = useState(null)

  const allImages = useMemo(() => {
    const productImages = [product.image];
    if (product.additional_images && product.additional_images.length > 0) {
      product.additional_images.forEach(img => productImages.push(img.image));
    }
    return productImages;
  }, [product.image, product.additional_images]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const currentImage = allImages[currentImageIndex];

  const showNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const showPrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const discountPercentage = useMemo(() => {
    if (product.sale_price && product.price) {
      const discount = ((parseFloat(product.price) - parseFloat(product.sale_price)) / parseFloat(product.price)) * 100
      return Math.round(discount)
    }
    return 0
  }, [product.price, product.sale_price])

  return (
    <article className="group card-surface relative flex flex-col overflow-hidden p-3 transition-all duration-300 hover:-translate-y-1 border border-black dark:border-zinc-600">

      {/* منطقة الصورة */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        {!imageErrors[currentImageIndex] && currentImage ? (
          <img
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            src={currentImage}
            alt={product.name}
            loading="lazy"
            onError={() => setImageErrors(prev => ({ ...prev, [currentImageIndex]: true }))}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-400">
            No Image
          </div>
        )}

        {/* أسهم تقليب الصور */}
        {allImages.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-2 z-10 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={showPrevImage}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-zinc-900 shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
              aria-label={isAr ? "الصورة السابقة" : "Previous Image"}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={showNextImage}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-zinc-900 shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
              aria-label={isAr ? "الصورة التالية" : "Next Image"}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Dots indicator */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
            {allImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  currentImageIndex === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* شارة الخصم */}
        {discountPercentage > 0 && (
          <div className="absolute left-2 top-2 z-10 rounded-full bg-brand-500 px-2 py-1 text-[10px] font-bold text-zinc-950 shadow-lg">
            -{discountPercentage}%
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {allImages.map((imgUrl, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentImageIndex(index)}
              className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150 ${
                currentImageIndex === index
                  ? 'border-brand-500 ring-2 ring-brand-200'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={imgUrl}
                className="h-full w-full object-cover"
                alt={`thumb ${index + 1}`}
                onError={() => setImageErrors(prev => ({ ...prev, [index]: true }))}
              />
            </button>
          ))}
        </div>
      )}

      {/* تفاصيل المنتج */}
      <div className="mt-4 flex flex-col flex-grow space-y-2.5">
        <div>
          <h3 className="text-sm font-bold text-black dark:text-zinc-100 line-clamp-1">
            {product.name}
          </h3>
          {product.category_name && (
            <p className="text-[10px] uppercase tracking-wider text-black dark:text-zinc-400">
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
                type="button"
                title={color.color_name}
                onClick={() => setSelectedColor(index)}
                className={`h-5 w-5 rounded-full border transition-all ${
                  selectedColor === index
                    ? 'ring-2 ring-brand-400 ring-offset-2 border-transparent'
                    : 'border-zinc-200 dark:border-zinc-700'
                }`}
                style={{ backgroundColor: color.color_code }}
              />
            ))}
          </div>
        )}

        {/* السعر وزر السلة */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex flex-col items-start gap-0.5">
            {product.sale_price ? (
              <>
                <span className="text-base font-black text-brand-600 dark:text-brand-400">
                  {formatPrice(product.sale_price, isAr)}
                </span>
                <span className="text-xs text-black line-through">
                  {formatPrice(product.price, isAr)}
                </span>
              </>
            ) : (
              <span className="text-base font-black text-black dark:text-zinc-100">
                {formatPrice(product.price, isAr)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={cartBusy || !onAddToCart}
            onClick={() => onAddToCart?.(product.id, selectedColor)}
            className="flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-xs font-bold text-white shadow-elevated transition-all hover:bg-zinc-800 active:scale-95 dark:bg-brand-500 dark:text-zinc-950 dark:hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
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