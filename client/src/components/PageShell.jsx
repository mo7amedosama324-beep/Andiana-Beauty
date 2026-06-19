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
      
      {/* 📸 طبقة الخلفية المتجاوبة والذكية (Responsive Background Layer) */}
      <div 
        className="fixed inset-0 -z-10 
                   bg-cover 
                   {/* 📝 تم تعديل البوزيشن هنا (bg-[...%_...%]) */}
                   bg-[10%_top]  {/* الديفولت للموبايل: الصورة تيجي من أقصى اليمين وفوق */}
                   
                   md:bg-center   {/* md: للكمبيوتر: ترجع تتوسطن */}
                   
                   bg-no-repeat
                   
                   {/* ⚠️ الصورة الافتراضية: للموبايل (طولية) */}
                   bg-[url('/images/bg-mobile.jpg')] 
                   
                   {/* ⚠️md breakpoint: الصورة للاب (عرضية) */}
                   md:bg-[url('/images/bg-desktop.jpg')]
        "
      />

      {/* محتوى الموقع الأساسي */}
      <div className={`mx-auto flex ${maxWidth} flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8`}>
        <SiteHeader
          isAr={isAr}
          setLang={setLang}
          t={t}
          authUser={authUser}
          onLogout={onLogout}
          cartCount={cartCount}
          nudePalette={nudePalette}
          onTogglePalette={togglePalette}
        />
        {children}
        <Footer isAr={isAr} />
      </div>
    </div>
  )
}