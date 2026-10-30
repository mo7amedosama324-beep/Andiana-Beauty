import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'

const MAX_REQUESTS = 12
const REQUEST_TIMEOUT_MS = 20000
const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

function getProductContext(products, isAr) {
  return products.slice(0, 80).map((product) => ({
    name: product.name,
    category: product.category_name || product.category || (isAr ? 'غير محدد' : 'Uncategorized'),
    description: product.description || '',
    price: product.sale_price || product.price,
    colors: product.colors?.map((color) => color.color_name).filter(Boolean) || [],
  }))
}

export default function GeminiChat() {
  const { isAr, products } = useApp()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [requestCount, setRequestCount] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const productContext = useMemo(() => JSON.stringify(getProductContext(products, isAr)), [isAr, products])
  const copy = isAr
    ? {
        label: 'مساعد أنديانا',
        subtitle: 'اسأليني عن المنتجات',
        placeholder: 'اسألي عن منتج أو روتين مناسب...',
        welcome: 'أهلًا! أقدر أساعدك تختاري المنتج الأنسب من منتجات أنديانا. اسأليني عن السعر، الاستخدام أو الفرق بين منتجين.',
        send: 'إرسال',
        limit: 'وصلتي للحد التجريبي المتاح لهذه الجلسة.',
        missingKey: 'المساعد غير متاح حاليًا. تأكدي من تشغيل خدمة المساعد.',
        error: 'حصلت مشكلة مؤقتة. جربي مرة ثانية.',
        timeout: 'الرد اتأخر. تأكدي من اتصال الإنترنت ومفتاح Gemini ثم جربي مرة ثانية.',
        suggestions: ['إيه أفضل منتج للبشرة الجافة؟', 'رشحيلي منتج أقل من 500 جنيه', 'إيه الفرق بين المنتجات المتاحة؟'],
      }

    : {
        label: 'Andiana Assistant',
        subtitle: 'Ask about our products',
        placeholder: 'Ask about a product or routine...',
        welcome: 'Hi! I can help you choose from Andiana products. Ask about price, usage, or the difference between two products.',
        send: 'Send',
        limit: 'You reached the demo limit for this session.',
        missingKey: 'Chat is not available right now. Please check the assistant service.',
        error: 'Something went wrong. Please try again.',
        timeout: 'The response timed out. Check your internet connection and Gemini key, then try again.',
        suggestions: ['What is best for dry skin?', 'Recommend something under EGP 500', 'Compare the available products'],
      }

  useEffect(() => {
    const handleProductSelection = (event) => {
      const product = event.detail
      if (!product) return
      setSelectedProduct(product)
      setOpen(true)
      setMessages([{
        role: 'model',
        text: isAr
          ? `أهلًا! اسأليني عن «${product.name}» — أقدر أوضح السعر، الوصف، الألوان، وهل يناسب احتياجك.`
          : `Hi! Ask me anything about “${product.name}”. I can explain its price, description, colors, and whether it fits your needs.`,
      }])
      setInput(isAr ? `إيه رأيك في ${product.name}؟` : `What do you think about ${product.name}?`)
    }

    window.addEventListener('andiana-ai-product', handleProductSelection)
    return () => window.removeEventListener('andiana-ai-product', handleProductSelection)
  }, [isAr])

  const sendMessage = async (event, suggestedText = '') => {
    event?.preventDefault()
    const text = (suggestedText || input).trim()
    if (!text || loading) return
    if (requestCount >= MAX_REQUESTS) {
      setMessages((current) => [...current, { role: 'model', text: copy.limit }])
      return
    }

    const nextMessages = [...messages, { role: 'user', text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      const response = await fetch(`${API_BASE}/ai/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          catalog: [
            ...(selectedProduct ? [{
              name: selectedProduct.name,
              category: selectedProduct.category_name || selectedProduct.category,
              description: selectedProduct.description || '',
              price: selectedProduct.sale_price || selectedProduct.price,
              colors: selectedProduct.colors?.map((color) => color.color_name).filter(Boolean) || [],
            }] : []),
            ...JSON.parse(productContext),
          ],
          language: isAr ? 'ar' : 'en',
        }),
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeoutId))
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'gemini-request')
      const answer = data.answer?.trim()
      if (!answer) throw new Error('empty-answer')
      setMessages((current) => [...current, { role: 'model', text: answer }])
      setRequestCount((count) => count + 1)
    } catch (error) {
      const message = error?.name === 'AbortError'
        ? copy.timeout
        : error?.message && error.message !== 'gemini-request'
          ? `${copy.error} (${error.message})`
          : copy.error
      setMessages((current) => [...current, { role: 'model', text: message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`gemini-chat ${open ? 'gemini-chat--open' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      {open ? (
        <section className="gemini-chat__panel" aria-label={copy.label}>
          <header className="gemini-chat__header">
            <div>
              <p>{copy.label}</p>
              <span>{selectedProduct ? (isAr ? `عن: ${selectedProduct.name}` : `About: ${selectedProduct.name}`) : copy.subtitle}</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={isAr ? 'إغلاق المساعد' : 'Close assistant'}>×</button>
          </header>
          <div className="gemini-chat__messages" aria-live="polite">
            {messages.length === 0 ? (
              <div className="gemini-chat__welcome">
                <span className="gemini-chat__spark">✦</span>
                <p>{copy.welcome}</p>
                <div className="gemini-chat__suggestions">
                  {copy.suggestions.map((suggestion) => (
                    <button key={suggestion} type="button" onClick={(event) => sendMessage(event, suggestion)}>{suggestion}</button>
                  ))}
                </div>
              </div>
            ) : messages.map((message, index) => (
              <div className={`gemini-chat__message gemini-chat__message--${message.role}`} key={`${message.role}-${index}`}>
                {message.text}
              </div>
            ))}
            {loading ? <div className="gemini-chat__typing"><i /><i /><i /></div> : null}
          </div>
          <form className="gemini-chat__form" onSubmit={sendMessage}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={copy.placeholder} disabled={loading} />
            <button type="submit" disabled={loading || !input.trim()}>{copy.send}</button>
          </form>
        </section>
      ) : null}
      <button className="gemini-chat__trigger" type="button" onClick={() => setOpen((value) => !value)} aria-label={copy.label}>
        <span>✦</span>
        <b>{copy.label}</b>
      </button>
    </div>
  )
}
