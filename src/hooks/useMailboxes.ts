import useSWR from 'swr'
import { Mailbox } from '@/types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useMailboxes() {
  const { data: mailboxes, error, mutate, isLoading } = useSWR<Mailbox[]>(
    '/api/mailboxes',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  return {
    mailboxes,
    isLoading,
    error,
    mutate
  }
} 