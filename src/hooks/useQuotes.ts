import useSWR from 'swr'
import { fetcher } from '@/lib/utils'

export function useQuotes() {
  const { data: quotes, error, mutate } = useSWR('/api/quotes', fetcher)

  return {
    quotes,
    isLoading: !error && !quotes,
    isError: error,
    mutate
  }
} 