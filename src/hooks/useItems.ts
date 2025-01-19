import useSWR, { mutate } from 'swr'
import { Item } from '@/types'
import { SWRKeys } from '@/lib/swr-keys'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useItems(groupId?: number | null) {
  const { data: items, error, mutate, isLoading } = useSWR<Item[]>(
    `/api/items${groupId ? `?groupId=${groupId}` : ''}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  return {
    items,
    isLoading,
    error,
    mutate
  }
} 