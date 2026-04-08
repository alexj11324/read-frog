import { i18n } from "#i18n"
import { browser } from "#imports"

export const SETTINGS_LOCALE_STORAGE_KEY = "read_frog_settings_locale"

const SUPPORTED_LOCALE_CODES = new Set([
  "en",
  "zh-CN",
  "zh-TW",
  "ja",
  "ko",
  "ru",
  "tr",
  "vi",
])

interface ChromeMessage {
  message?: string
  placeholders?: Record<string, { content?: string }>
}

let selectedLocale: string | null = null
let selectedMessages: Record<string, ChromeMessage> | null = null

const LOCALE_SEPARATOR = /[-_]/

function toChromeLocaleCode(locale: string): string {
  const [lang, region] = locale.split(LOCALE_SEPARATOR)
  if (!region)
    return lang.toLowerCase()
  return `${lang.toLowerCase()}_${region.toUpperCase()}`
}

function normalizeLocale(locale: string | null | undefined): string | null {
  if (!locale)
    return null

  const trimmed = locale.trim()
  if (!trimmed)
    return null

  const canonical = trimmed.replace("_", "-")
  if (SUPPORTED_LOCALE_CODES.has(canonical))
    return canonical

  const lower = canonical.toLowerCase()
  if (lower.startsWith("zh-")) {
    if (lower.includes("tw") || lower.includes("hant"))
      return "zh-TW"
    return "zh-CN"
  }

  const short = lower.split("-")[0]
  return SUPPORTED_LOCALE_CODES.has(short) ? short : null
}

function applyPlaceholders(raw: string, placeholders?: Record<string, { content?: string }>): string {
  if (!placeholders)
    return raw
  return Object.entries(placeholders).reduce((acc, [key, placeholder]) => {
    const content = placeholder?.content
    if (!content)
      return acc
    return acc.replaceAll(`$${key}$`, content)
  }, raw)
}

async function loadLocaleMessages(locale: string): Promise<Record<string, ChromeMessage> | null> {
  const localeCode = toChromeLocaleCode(locale)
  try {
    // @ts-expect-error -- _locales is a valid extension resource but not in WXT's PublicPath type
    const url: string = browser.runtime.getURL(`_locales/${localeCode}/messages.json`)
    const response = await fetch(url)
    if (!response.ok)
      return null
    return await response.json() as Record<string, ChromeMessage>
  }
  catch {
    return null
  }
}

/**
 * Patch i18n.t() directly instead of browser.i18n.getMessage().
 * This is more reliable because i18n is a plain JS object,
 * while chrome.i18n.getMessage may be non-writable in MV3.
 */
function patchI18nT() {
  const originalT = i18n.t

  const patchedT = (key: string, ...args: unknown[]): string => {
    if (!selectedLocale || !selectedMessages) {
      return (originalT as (key: string, ...args: unknown[]) => string)(key, ...args)
    }

    const msgKey = String(key).replaceAll(".", "_")
    const entry = selectedMessages[msgKey]
    if (!entry?.message) {
      return (originalT as (key: string, ...args: unknown[]) => string)(key, ...args)
    }

    // Parse args: substitution array and/or count number
    // (mirrors @wxt-dev/i18n createI18n logic)
    let sub: string[] | undefined
    let count: number | undefined
    for (const arg of args) {
      if (arg == null)
        continue
      if (typeof arg === "number")
        count = arg
      else if (Array.isArray(arg))
        sub = arg as string[]
    }
    if (count != null && sub == null)
      sub = [String(count)]

    let message = applyPlaceholders(entry.message, entry.placeholders)

    // Apply positional substitutions ($1, $2, ...)
    if (sub?.length) {
      message = sub.reduce(
        (acc, s, idx) => acc.replaceAll(`$${idx + 1}`, String(s)),
        message,
      )
    }

    // Handle pluralization
    if (count == null)
      return message
    const plural = message.split(" | ")
    switch (plural.length) {
      case 1: return plural[0]
      case 2: return plural[count === 1 ? 0 : 1]
      case 3: return plural[count === 0 || count === 1 ? count : 2]
      default: return message
    }
  }

  // Replace i18n.t with our patched version
  ;(i18n as { t: typeof i18n.t }).t = patchedT as typeof i18n.t
}

export async function setupOptionsLocaleOverride() {
  const saved = normalizeLocale(localStorage.getItem(SETTINGS_LOCALE_STORAGE_KEY))
  if (!saved)
    return

  selectedLocale = saved
  selectedMessages = await loadLocaleMessages(saved)

  if (selectedMessages) {
    patchI18nT()
  }
}
