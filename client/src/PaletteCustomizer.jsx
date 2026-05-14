import { useState, useEffect } from 'react'

// Predefined color themes
const THEMES = {
  default: {
    name: 'Golden',
    colors: {
      'brand-500': '#C5A880',
      'brand-600': '#A68B66',
      'sand-50': '#FDFCFB',
      'sand-100': '#F7F3F0',
      'rose-200': '#FECDD3',
      'rose-100': '#FFE4E6',
      'amber-200': '#FCD34D',
      'amber-100': '#FEF3C7',
    }
  },
  nude: {
    name: 'Nude',
    colors: {
      'brand-500': '#D4A99D',
      'brand-600': '#B89080',
      'sand-50': '#FAF8F6',
      'sand-100': '#F5F0ED',
      'rose-200': '#F5D9D1',
      'rose-100': '#FAE8E3',
      'amber-200': '#F5E6C8',
      'amber-100': '#FAF1E3',
    }
  },
  berry: {
    name: 'Berry',
    colors: {
      'brand-500': '#BE7A8F',
      'brand-600': '#A85A75',
      'sand-50': '#FCF8FA',
      'sand-100': '#F7F0F5',
      'rose-200': '#F8D7E8',
      'rose-100': '#FBE7F3',
      'amber-200': '#F5D4E8',
      'amber-100': '#FAE8F2',
    }
  },
  ocean: {
    name: 'Ocean',
    colors: {
      'brand-500': '#5B8FA3',
      'brand-600': '#3D6B87',
      'sand-50': '#F6F9FB',
      'sand-100': '#EEF4F8',
      'rose-200': '#D9E8F3',
      'rose-100': '#EBF4FB',
      'amber-200': '#D9E9F5',
      'amber-100': '#EBF3FB',
    }
  }
}

export default function PaletteCustomizer({ isAr, t = {} }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('default')
  const [customColors, setCustomColors] = useState({})
  const [showCustom, setShowCustom] = useState(false)

  // Load saved theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('andiana-theme')
    const savedCustom = localStorage.getItem('andiana-custom-colors')
    
    if (saved) {
      setSelectedTheme(saved)
      setShowCustom(saved === 'custom')
    }
    
    if (savedCustom) {
      try {
        const colors = JSON.parse(savedCustom)
        setCustomColors(colors)
        applyColors(colors)
      } catch (e) {
        console.error('Failed to parse saved colors:', e)
      }
    } else {
      applyColors(THEMES[selectedTheme].colors)
    }
  }, [])

  const applyColors = (colors) => {
    const root = document.documentElement
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
  }

  const handleThemeChange = (themeName) => {
    setSelectedTheme(themeName)
    setShowCustom(false)
    
    const themeColors = THEMES[themeName].colors
    setCustomColors(themeColors)
    applyColors(themeColors)
    
    localStorage.setItem('andiana-theme', themeName)
    localStorage.removeItem('andiana-custom-colors')
  }

  const handleColorChange = (colorKey, value) => {
    const updatedColors = { ...customColors, [colorKey]: value }
    setCustomColors(updatedColors)
    applyColors(updatedColors)
    
    localStorage.setItem('andiana-theme', 'custom')
    localStorage.setItem('andiana-custom-colors', JSON.stringify(updatedColors))
  }

  const toggleCustomMode = () => {
    setShowCustom(!showCustom)
    if (!showCustom) {
      // Enter custom mode
      setSelectedTheme('custom')
      localStorage.setItem('andiana-theme', 'custom')
    }
  }

  const themeLabels = isAr ? {
    default: 'ذهبي',
    nude: 'نيود',
    berry: 'توت',
    ocean: 'محيط'
  } : {
    default: 'Golden',
    nude: 'Nude',
    berry: 'Berry',
    ocean: 'Ocean'
  }

  const colorLabels = isAr ? {
    'brand-500': 'اللون الأساسي الفاتح',
    'brand-600': 'اللون الأساسي الغامق',
    'sand-50': 'الرمل الفاتح جداً',
    'sand-100': 'الرمل الفاتح',
    'rose-200': 'الوردي الفاتح',
    'rose-100': 'الوردي جداً فاتح',
    'amber-200': 'الأمبر الفاتح',
    'amber-100': 'الأمبر جداً فاتح',
  } : {
    'brand-500': 'Primary Light',
    'brand-600': 'Primary Dark',
    'sand-50': 'Sand Very Light',
    'sand-100': 'Sand Light',
    'rose-200': 'Rose Light',
    'rose-100': 'Rose Very Light',
    'amber-200': 'Amber Light',
    'amber-100': 'Amber Very Light',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Palette Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full border border-brand-500/20 bg-white px-4 py-3 text-lg font-semibold text-stone-700 shadow-glow transition hover:-translate-y-0.5 hover:shadow-lg"
        title={isAr ? 'تخصيص الألوان' : 'Customize colors'}
        aria-label={isAr ? 'تخصيص الألوان' : 'Customize colors'}
      >
        🎨
      </button>

      {/* Palette Customizer Panel */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white border border-brand-500/10 shadow-lg p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-brand-500/10 pb-3">
            <h3 className="font-semibold text-stone-900">
              {isAr ? 'تخصيص الألوان' : 'Customize Colors'}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-stone-900 text-lg"
            >
              ✕
            </button>
          </div>

          {/* Theme Selector */}
          <div>
            <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
              {isAr ? 'الألوان المحفوظة' : 'Saved Themes'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                    selectedTheme === key && !showCustom
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {themeLabels[key]}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors Toggle */}
          <div className="border-t border-brand-500/10 pt-3">
            <button
              onClick={toggleCustomMode}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition ${
                showCustom
                  ? 'bg-brand-500/20 text-stone-900 border border-brand-500/50'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {isAr ? '✏️ تخصيص يدوي' : '✏️ Custom'}
            </button>
          </div>

          {/* Color Picker Grid */}
          {showCustom && (
            <div className="space-y-3 border-t border-brand-500/10 pt-3">
              {Object.entries(customColors).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    {colorLabels[key] || key}
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="h-8 w-12 rounded border border-brand-500/20 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="flex-1 px-2 py-1 text-xs rounded border border-brand-500/20 font-mono text-stone-600"
                      placeholder="#C5A880"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preview */}
          <div className="border-t border-brand-500/10 pt-3">
            <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
              {isAr ? 'معاينة' : 'Preview'}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(customColors).slice(0, 8).map(([key, value]) => (
                <div
                  key={key}
                  className="h-10 rounded-lg border border-brand-500/10 shadow-sm cursor-help"
                  style={{ backgroundColor: value }}
                  title={key}
                />
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => handleThemeChange('default')}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 transition border border-brand-500/10"
          >
            {isAr ? '↻ استعادة الافتراضي' : '↻ Reset to Default'}
          </button>
        </div>
      )}
    </div>
  )
}
