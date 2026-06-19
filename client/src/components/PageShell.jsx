import Footer from './Footer'
import SiteHeader from './SiteHeader'

export default function PageShell({
  isAr,
  setLang,
  t,
  authUser,
  onLogout,
  cartCount = 0,
  nudePalette,
  onTogglePalette,
  children,
  maxWidth = 'max-w-7xl',
}) {
  return (
    <div 
      className={`min-h-screen text-stone-900 bg-cover bg-center bg-no-repeat bg-fixed ${isAr ? 'font-arabic' : 'font-body'}`} 
      dir={isAr ? 'rtl' : 'ltr'}
      // ⚠️ ضع هنا اسم صورتك الحقيقي الموجود داخل فولدر public
      style={{ backgroundImage: "url('/imgs/bg-image.jpg')" }}
    >
      <div className={`mx-auto flex ${maxWidth} flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8`}>
        <SiteHeader
          isAr={isAr}
          setLang={setLang}
          t={t}
          authUser={authUser}
          onLogout={onLogout}
          cartCount={cartCount}
          nudePalette={nudePalette}
          onTogglePalette={onTogglePalette}
        />
        {children}
        <Footer isAr={isAr} />
      </div>
    </div>
  )
}