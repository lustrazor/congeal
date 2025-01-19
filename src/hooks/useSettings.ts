import useSWR from 'swr'
import { Settings } from '@/types'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch settings')
  }
  const data = await response.json()
  console.log('Settings from DB:', {
    headerImage: data.headerImage,
    headerEnabled: data.headerEnabled
  })
  return data
}

export function useSettings() {
  const { data: settings, error, mutate } = useSWR<Settings>('/api/settings', fetcher)

  return {
    settings,
    isLoading: !error && !settings,
    isError: error,
    mutate
  }
} 