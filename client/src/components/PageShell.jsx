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
    <div className={`relative min-h-screen text-stone-900 ${isAr ? 'font-arabic' : 'font-body'}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* 📸 الطبقة السحرية للخلفية الثابتة: متوافقة 100% مع الموبايل والكمبيوتر */}
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/imgs/bg-image.jpg.jpeg')" }} 
      />

      {/* محتوى الموقع الأساسي فوق الخلفية */}
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