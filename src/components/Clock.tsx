import { useState, useEffect } from 'react'

export default function Clock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
//      second: '2-digit',
      hour12: true
    }).format(date)
  }

  return (
    <div className="text-sm text-slate-300/70 dark:text-slate-300/70 font-mono">
      {formatDate(time)}
    </div>
  )
} 