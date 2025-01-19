'use client'
import { DragDropContext } from '@hello-pangea/dnd'

interface DragDropContextWrapperProps {
  children: React.ReactNode
  onDragEnd: (result: any) => void
}

export default function DragDropContextWrapper({ children, onDragEnd }: DragDropContextWrapperProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {children}
    </DragDropContext>
  )
} 