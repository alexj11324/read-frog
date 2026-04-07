import { i18n } from "#imports"
import { useState, useEffect } from "react"

const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
  { code: "vi", label: "Tiếng Việt" },
]

export default function SettingsLanguageSwitcher() {
  const _i18n = i18n as any

  const getInitial = () => {
    // Try common fields, fall back to navigator
    const fromI18n = _i18n?.locale ?? _i18n?.language
    const fromStorage = typeof localStorage !== "undefined" ? localStorage.getItem("read_frog_locale") : null
    const nav = typeof navigator !== "undefined" ? navigator.language : "en"
    return (fromI18n as string) || fromStorage || nav || "en"
  }

  const [locale, setLocale] = useState<string>(getInitial)

  useEffect(() => {
    // keep local state in sync if the global i18n exposes a value
    const cur = (_i18n?.locale ?? _i18n?.language) as string | undefined
    if (cur && cur !== locale) setLocale(cur)
  }, [])

  const applyLocale = async (next: string) => {
    try {
      if (typeof _i18n?.changeLanguage === "function") {
        await _i18n.changeLanguage(next)
        return
      }
      if (typeof _i18n?.setLocale === "function") {
        await _i18n.setLocale(next)
        return
      }
      if (typeof _i18n?.setLanguage === "function") {
        await _i18n.setLanguage(next)
        return
      }
    }
    catch (err) {
      // ignore and fallback to reload
      console.warn("i18n change API failed:", err)
    }

    // fallback: persist and reload so the i18n loader picks the new locale
    try {
      localStorage.setItem("read_frog_locale", next)
      // full reload so that any i18n initialization will pick up stored locale
      location.reload()
    }
    catch (err) {
      console.error("Failed to persist locale or reload:", err)
    }
  }

  return (
    <div className="ml-auto flex items-center gap-2">
      <label className="text-sm text-muted-foreground sr-only" htmlFor="settings-locale-select">Settings language</label>
      <select
        id="settings-locale-select"
        value={locale}
        onChange={(e) => {
          const next = e.target.value
          setLocale(next)
          void applyLocale(next)
        }}
        className="rounded-md border px-2 py-1 bg-white dark:bg-neutral-900"
        aria-label="Settings language"
      >
        {SUPPORTED_LOCALES.map(l => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  )
}
