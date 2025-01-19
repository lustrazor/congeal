import { Status } from '@/types'

export const getStatusColor = (status: string): string => {
  const statusColors: Record<Status, string> = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    purple: 'bg-purple-500 text-white',
    gray: 'bg-gray-300 text-gray-700'
  }

  return statusColors[status as Status] || statusColors.gray
}

export const statusOrder: Status[] = ['gray', 'blue', 'green', 'yellow', 'red', 'purple']

export const getNextStatus = (currentStatus: Status): Status => {
  const currentIndex = statusOrder.indexOf(currentStatus)
  return statusOrder[(currentIndex + 1) % statusOrder.length]
}

export const urlRegex = /(https?:\/\/[^\s]+)/g 