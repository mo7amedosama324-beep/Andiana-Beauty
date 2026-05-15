export default function Footer({ isAr }) {
  return (
    <footer className="mt-10 rounded-page border border-white/40 bg-white/80 px-6 py-5 text-sm text-stone-500 shadow-soft backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>{isAr ? 'Andiana Beauty • تجربة تسوق هادئة وفاخرة.' : 'Andiana Beauty • calm luxury shopping.'}</p>
        <p>{new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}
