import { useSettings } from './useSettings'
import { translations, TranslationKey } from '@/lib/translations'
import { useMemo } from 'react'

export function useTranslations() {
  const { settings } = useSettings()
  const language = (settings?.language || 'en') as keyof typeof translations

  const t = useMemo(() => {
    return (key: TranslationKey) => {
      return translations[language][key]
    }
  }, [language])

  return { t, language }
} 