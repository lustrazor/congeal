import { useQuery } from '@tanstack/react-query'

interface MessageContent {
  content: string
  fullContent: string
  isHtml: boolean
}

export function useMessageContent(messageId: number, mailboxId: number, isExpanded: boolean) {
  return useQuery<MessageContent>({
    queryKey: ['messageContent', messageId, mailboxId],
    queryFn: async () => {
      const response = await fetch(
        `/api/messages/${messageId}/content?mailboxId=${mailboxId}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch message content')
      }
      return response.json()
    },
    enabled: isExpanded, // Only fetch when message is expanded
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  })
} 