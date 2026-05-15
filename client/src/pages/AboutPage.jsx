import PageShell from '../components/PageShell'
import ScrollReveal from '../components/ScrollReveal'
import { useApp } from '../context/AppContext'

export default function AboutPage() {
  const { isAr, setLang, t, authUser, handleLogout, cartItemCount, nudePalette, togglePalette } = useApp()
  const sections = t.about.sections
  const imgOnline = '/imgs/photo-1512207576147-99bc3066b621.jpg'
  const imgMakeup = '/imgs/makeup-powder-foundation-brushes.jpg'
  const imgBoutique = '/imgs/istockphoto-1093145614-612x612.jpg'

  return (
    <PageShell isAr={isAr} setLang={setLang} t={t} authUser={authUser} onLogout={handleLogout} cartCount={cartItemCount} nudePalette={nudePalette} onTogglePalette={togglePalette}>
      <div className="space-y-16 md:space-y-24">
        <ScrollReveal hero>
          <header className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500/90">{t.about.subtitle}</p>
            <h1 className="mt-3 font-display text-4xl text-stone-900 md:text-5xl">{t.about.title}</h1>
            <p className="mt-5 text-base leading-relaxed text-stone-600 md:text-lg">{t.about.intro}</p>
          </header>
        </ScrollReveal>

        {sections.map((section, index) => (
          <ScrollReveal key={section.title}>
            <section className="rounded-page border border-white/40 bg-white/80 p-6 shadow-soft md:p-10 lg:p-12">
              <div className={`grid items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16 ${index % 2 === 1 ? 'md:[direction:rtl]' : ''}`}>
                <div className={`space-y-4 ${index % 2 === 1 ? 'md:[direction:ltr]' : ''}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">{section.eyebrow}</p>
                  <h2 className="font-display text-2xl text-stone-900 md:text-3xl">{section.title}</h2>
                  <p className="text-sm leading-relaxed text-stone-600 md:text-base">{section.body}</p>
                </div>
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-rose-100/50 via-amber-50/50 to-white shadow-inner ring-1 ring-stone-900/5">
                    <img src={index === 0 ? imgOnline : index === 1 ? imgMakeup : imgBoutique} alt="" className="h-full w-full object-cover" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} />
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>
        ))}
      </div>
    </PageShell>
  )
}
