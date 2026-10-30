import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'

const MAX_REQUESTS = 12
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash'
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

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

  const productContext = useMemo(() => JSON.stringify(getProductContext(products, isAr)), [isAr, products])
  const copy = isAr
    ? {
        label: 'مساعد أنديانا',
        subtitle: 'اسأليني عن المنتجات',
        placeholder: 'اسألي عن منتج أو روتين مناسب...',
        welcome: 'أهلًا! أقدر أساعدك تختاري المنتج الأنسب من منتجات أنديانا. اسأليني عن السعر، الاستخدام أو الفرق بين منتجين.',
        send: 'إرسال',
        limit: 'وصلتي للحد التجريبي المتاح لهذه الجلسة.',
        missingKey: 'المساعد غير متاح حاليًا. أضيفي VITE_GEMINI_API_KEY في ملف .env.local ثم أعيدي تشغيل الموقع.',
        error: 'حصلت مشكلة مؤقتة. جربي مرة ثانية.',
        suggestions: ['إيه أفضل منتج للبشرة الجافة؟', 'رشحيلي منتج أقل من 500 جنيه', 'إيه الفرق بين المنتجات المتاحة؟'],
      }
    : {
        label: 'Andiana Assistant',
        subtitle: 'Ask about our products',
        placeholder: 'Ask about a product or routine...',
        welcome: 'Hi! I can help you choose from Andiana products. Ask about price, usage, or the difference between two products.',
        send: 'Send',
        limit: 'You reached the demo limit for this session.',
        missingKey: 'Chat is not configured yet. Add VITE_GEMINI_API_KEY to .env.local and restart the app.',
        error: 'Something went wrong. Please try again.',
        suggestions: ['What is best for dry skin?', 'Recommend something under EGP 500', 'Compare the available products'],
      }

  const sendMessage = async (event, suggestedText = '') => {
    event?.preventDefault()
    const text = (suggestedText || input).trim()
    if (!text || loading) return
    if (!API_KEY) {
      setMessages((current) => [...current, { role: 'model', text: copy.missingKey }])
      setInput('')
      return
    }
    if (requestCount >= MAX_REQUESTS) {
      setMessages((current) => [...current, { role: 'model', text: copy.limit }])
      return
    }

    const nextMessages = [...messages, { role: 'user', text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    try {
      const contents = nextMessages.slice(-8).map((message) => ({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.text }],
      }))
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{
                text: `You are Andiana Beauty's product assistant. Answer in ${isAr ? 'Arabic' : 'English'}.
Only recommend products from the catalog below. Never invent stock, ingredients, medical claims, discounts, or delivery promises.
Be concise, friendly, and mention when the catalog does not contain enough information. Prices are in EGP.
Catalog: ${productContext}`,
              }],
            },
            contents,
            generationConfig: { temperature: 0.4, maxOutputTokens: 350 },
          }),
        },
      )
      if (!response.ok) throw new Error('gemini-request')
      const data = await response.json()
      const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join(' ').trim()
      if (!answer) throw new Error('empty-answer')
      setMessages((current) => [...current, { role: 'model', text: answer }])
      setRequestCount((count) => count + 1)
    } catch {
      setMessages((current) => [...current, { role: 'model', text: copy.error }])
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
              <span>{copy.subtitle}</span>
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
