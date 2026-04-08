import { browser } from "#imports"
import { useMemo, useState } from "react"
import { SETTINGS_LOCALE_STORAGE_KEY } from "../i18n-override"

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
  const browserLocale = useMemo(
    () => browser.i18n.getUILanguage?.() || browser.i18n.getMessage("@@ui_locale") || "en",
    [],
  )

  const initialLocale = useMemo(
    () => localStorage.getItem(SETTINGS_LOCALE_STORAGE_KEY) || browserLocale,
    [browserLocale],
  )

  const [locale, setLocale] = useState<string>(initialLocale)

  const applyLocale = (next: string) => {
    try {
      localStorage.setItem(SETTINGS_LOCALE_STORAGE_KEY, next)
      location.reload()
    }
    catch (err) {
      console.error("Failed to switch settings language:", err)
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
