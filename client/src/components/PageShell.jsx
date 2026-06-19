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
      
      {/* 📸 الخلفية بمسارات ملفاتك الحقيقية بالظبط وبأفضل تنسيق للأبعاد */}
      <div 
        className="fixed inset-0 -z-10 
                   bg-cover 
                   bg-top           {/* للموبايل: الصورة تبدأ من فوق عشان تظهر كاملة على قد ما تقدر */}
                   md:bg-center     {/* للكمبيوتر: الصورة تتوسطن في الشاشة */}
                   bg-no-repeat 
                   bg-[url('/imgs/bg-image.jpg.jpeg')]   {/* صورة الفون الحقيقية */}
                   md:bg-[url('/imgs/mo.jpeg')]          {/* صورة اللاب الحقيقية */}
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
          onTogglePalette={onTogglePalette}
        />
        {children}
        <Footer isAr={isAr} />
      </div>
    </div>
  )
}