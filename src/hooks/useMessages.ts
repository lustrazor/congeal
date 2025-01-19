import useSWR from 'swr'
import { Message } from '@/types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useMessages(mailboxId?: number | null) {
  const { data: messages, error, mutate, isLoading } = useSWR<Message[]>(
    `/api/messages${mailboxId ? `?mailboxId=${mailboxId}` : ''}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  return {
    messages,
    isLoading,
    error,
    mutate
  }
} 