import useSWR, { mutate } from 'swr'
import { Group } from '@/types'
import { SWRKeys } from '@/lib/swr-keys'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch groups')
  }
  return response.json()
}

export function useGroups() {
  const { data, error, isLoading } = useSWR<Group[]>(
    SWRKeys.groups,
    fetcher,
    {
      // Add configuration to prevent excessive revalidation
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000, // Dedupe requests within 1 second
    }
  )

  const mutateGroups = async (data?: Group[]) => {
    await mutate(SWRKeys.groups, data, {
      revalidate: true,
      populateCache: true
    })
  }

  return {
    groups: data?.sort((a, b) => a.order - b.order),
    isLoading,
    isError: error,
    mutate: mutateGroups,
  }
} 