import { useEffect, useRef, useState } from 'react'

export default function ScrollReveal({ children, className = '', rootMargin = '0px 0px -12% 0px', hero = false }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: hero ? 0.04 : 0.08, rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hero, rootMargin])

  return (
    <div
      ref={ref}
      className={`scroll-reveal${shown ? ' scroll-reveal--in' : ''}${className ? ` ${className}` : ''}`.trim()}
    >
      {children}
    </div>
  )
}
