'use client'
import { useState, useEffect } from 'react'
import { useItems } from '@/hooks/useItems'
import { Item } from '@/types'

interface CalendarProps {
  className?: string
  onItemClick?: (item: Item) => void
}

export default function Calendar({ className = '', onItemClick }: CalendarProps) {
  const [date, setDate] = useState(new Date())
  const { items } = useItems()

  // Update date every minute to handle day changes at midnight
  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Get all due dates and their items for the current month
  const dueDateItems = new Map<number, Item[]>()
  items?.forEach(item => {
    if (!item.dueAt) return
    const dueDate = new Date(item.dueAt)
    if (dueDate.getMonth() === date.getMonth() && 
        dueDate.getFullYear() === date.getFullYear()) {
      const day = dueDate.getDate()
      if (!dueDateItems.has(day)) {
        dueDateItems.set(day, [])
      }
      dueDateItems.get(day)!.push(item)
    }
  })

  // Get earliest due item for a given day
  const getFirstDueItem = (day: number): Item | undefined => {
    const items = dueDateItems.get(day)
    if (!items?.length) return undefined
    return items.sort((a, b) => 
      new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime()
    )[0]
  }

  // Format month and year
  const month = date.toLocaleString('default', { month: 'long' })
  const year = date.getFullYear()

  // Get days in month
  const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate()
  
  // Get first day of month (0 = Sunday)
  const firstDayOfMonth = new Date(year, date.getMonth(), 1).getDay()
  
  // Get current day
  const currentDay = date.getDate()

  // Create array of week day names
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  // Create array of blank days before first day of month
  const blanks = Array(firstDayOfMonth).fill(null)
  
  // Create array of days in month
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Combine arrays for all calendar cells
  const allDays = [...blanks, ...days]

  return (
    <div className={`bg-black/70 rounded-md border border-slate-400/50 ${className}`}>
      {/* Calendar Grid */}
      <div className="p-2">
        {/* Week day headers */}
        <div className="grid grid-cols-7 mb-1">
          {weekDays.map(day => (
            <div 
              key={day} 
              className="text-center text-xs font-medium text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {allDays.map((day, index) => {
            const dueItem = day ? getFirstDueItem(day) : undefined
            return (
              <div
                key={index}
                className={`
                  flex items-center justify-center text-sm rounded-sm px-0.5
                  ${!day ? 'text-slate-400' : 
                    day === currentDay ?
                      'bg-blue-500/70 text-white font-medium' :
                    dueItem ?
                      'bg-red-500/80 text-white cursor-pointer hover:bg-red-600' :
                      'text-slate-300 hover:bg-slate-500 hover:text-white'
                  }
                `}
                onClick={() => {
                  if (dueItem && onItemClick) {
                    onItemClick(dueItem)
                  }
                }}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 