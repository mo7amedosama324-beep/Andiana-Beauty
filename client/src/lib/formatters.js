export const CART_STORAGE_KEY = 'andiana_cart_id'

export function getApiOrigin(apiBase) {
  if (!apiBase) return ''
  try {
    return new URL(apiBase).origin
  } catch {
    return ''
  }
}

export function formatPrice(value, isAr) {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return ''
  return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-EG', {
    style: 'currency',
    currency: 'EGP',
  }).format(numeric)
}

export function resolveImage(src, apiOrigin) {
  if (!src) return ''
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('/media/') && apiOrigin) return `${apiOrigin}${src}`
  return src
}
