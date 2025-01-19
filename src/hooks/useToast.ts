import { useCallback } from 'react'
import { toast } from 'react-hot-toast'

export function useToast() {
  const success = useCallback((message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'bottom-right',
      className: 'dark:bg-gray-800 dark:text-white'
    })
  }, [])

  const error = useCallback((message: string) => {
    toast.error(message, {
      duration: 4000,
      position: 'bottom-right',
      className: 'dark:bg-gray-800 dark:text-white'
    })
  }, [])

  return {
    success,
    error
  }
} 