'use client'
import { useState } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { Mailbox } from '@/types'
import { useTranslations } from '@/hooks/useTranslations'
import Modal from './ui/Modal'
import MailboxForm from './forms/MailboxForm'
import { useDebugStore } from '@/stores/debugStore'
import DragDropContextWrapper from './DragDropContextWrapper'
import 'boxicons/css/boxicons.min.css'

interface SidebarEmailProps {
  mailboxes: Mailbox[]
  onMailboxesChange: (mailboxes: Mailbox[]) => void
  selectedMailboxId: number | null
  onMailboxSelect: (id: number | null) => void
  searchQuery: string
  onSearch: (query: string) => void
}

interface MailboxFormProps {
  editMailbox?: Mailbox | null
  onClose: () => void
  onMailboxesChange: (savedMailbox: Mailbox) => void
}

export default function SidebarEmail({
  mailboxes,
  onMailboxesChange,
  selectedMailboxId,
  onMailboxSelect,
  searchQuery,
  onSearch
}: SidebarEmailProps) {
  const { t } = useTranslations()
  const debugStore = useDebugStore()
  const [isMailboxModalOpen, setIsMailboxModalOpen] = useState(false)
  const [hoveredMailboxId, setHoveredMailboxId] = useState<number | null>(null)
  const [editingMailbox, setEditingMailbox] = useState<Mailbox | null>(null)

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const startTime = Date.now()
    const items = Array.from(mailboxes)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order property for each item
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }))

    try {
      // Update UI immediately
      onMailboxesChange(updatedItems)

      // Save new order to server
      const response = await fetch('/api/mailboxes/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mailboxes: updatedItems })
      })

      if (!response.ok) throw new Error('Failed to save order')
      const { debug } = await response.json()
      const duration = Date.now() - startTime

      debugStore.setCommandLog({
        command: 'REORDER_MAILBOXES',
        response: {
          status: 'success',
          duration: debug?.duration,
          query: debug?.query,
          clientDuration: `${duration}ms`
        }
      })
    } catch (error) {
      console.error('Error saving order:', error)
      debugStore.setCommandLog({
        command: 'REORDER_MAILBOXES',
        response: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to save order'
        }
      })
    }
  }

  const handleAddDivider = async () => {
    try {
      debugStore.setCommandLog({
        type: 'ADD_DIVIDER'
      });

      const response = await fetch('/api/mailboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '──────────',
          isDivider: true,
          iconName: null,
          iconColor: null,
          order: mailboxes.length
        }),
      });

      if (!response.ok) throw new Error('Failed to add divider');
      const data = await response.json();
      debugStore.setResponseLog(data);
      onMailboxesChange([...mailboxes, data]);
    } catch (error) {
      console.error('Error adding divider:', error);
      debugStore.setResponseLog({ error: String(error) });
    }
  };

  const handleDeleteMailbox = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/mailboxes/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete mailbox')
      onMailboxesChange(mailboxes.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error deleting mailbox:', error)
    }
  }

  const handleEditMailbox = (mailbox: Mailbox, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMailboxModalOpen(true)
    setEditingMailbox({
      id: mailbox.id,
      name: mailbox.name,
      iconName: mailbox.iconName || 'bx-envelope',
      iconColor: mailbox.iconColor || 'gray',
      email: mailbox.email,
      imapHost: mailbox.imapHost,
      imapPort: mailbox.imapPort,
      username: mailbox.username,
      password: mailbox.password
    })
  }

  const handleMailboxUpdate = (savedMailbox: Mailbox) => {
    if (editingMailbox) {
      // Update existing mailbox
      onMailboxesChange(
        mailboxes.map(m => m.id === savedMailbox.id ? savedMailbox : m)
      )
    } else {
      // Add new mailbox
      onMailboxesChange([...mailboxes, savedMailbox])
    }
    setIsMailboxModalOpen(false)
    setEditingMailbox(null)
  }

  return (
    <aside className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 
      bg-gray-50 dark:bg-gray-900">
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto bg-[url('/images/dropshadow-sidebar-light.png')] 
          dark:bg-[url('/images/dropshadow-sidebar-dark.png')] bg-top bg-repeat-x">
          <div className="p-4">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Mailboxes
            </h1>
          </div>

          <nav className="p-2">
            <DragDropContextWrapper onDragEnd={handleDragEnd}>
              <Droppable droppableId="mailboxes">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-1 mt-2"
                  >
                    {mailboxes.map((mailbox, index) => (
                      <Draggable 
                        key={mailbox.id} 
                        draggableId={mailbox.id.toString()} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`
                              font-medium p-0.5 rounded cursor-pointer
                              ${mailbox.isDivider ? 'py-2' : ''}
                              ${!mailbox.isDivider && selectedMailboxId === mailbox.id 
                                ? 'bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'
                              }
                              ${snapshot.isDragging ? 'bg-gray-100 dark:bg-gray-800/50 shadow-lg' : ''}
                              relative group
                            `}
                            onClick={() => !mailbox.isDivider && onMailboxSelect(mailbox.id)}
                            onMouseEnter={() => setHoveredMailboxId(mailbox.id)}
                            onMouseLeave={() => setHoveredMailboxId(null)}
                          >
                            <div className="flex items-center justify-between px-2">
                              <div className="flex items-center gap-2 flex-1">
                                {/* Drag handle - always visible for dividers */}
                                <div 
                                  {...provided.dragHandleProps} 
                                  className={`
                                    text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 
                                    cursor-grab active:cursor-grabbing
                                    transition-opacity duration-200
                                    ${mailbox.isDivider || hoveredMailboxId === mailbox.id ? 'opacity-100' : 'opacity-0'}
                                  `}
                                >
                                  <svg className="w-2 h-2 ml-2 mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                  </svg>
                                </div>

                                {/* Render divider or mailbox content */}
                                {mailbox.isDivider ? (
                                  <div className="h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
                                ) : (
                                  <>
                                    {/* Mailbox icon */}
                                    {mailbox.iconName && (
                                      <box-icon
                                        type="solid"
                                        name={mailbox.iconName}
                                        color={`var(--color-${mailbox.iconColor}-500)`}
                                        size="1.25rem"
                                        class="text-gray-700 dark:text-gray-300"
                                      ></box-icon>
                                    )}
                                    <span className="font-normal text-gray-900 dark:text-gray-100">
                                      {mailbox.name}
                                    </span>
                                    {mailbox._count?.messages > 0 && (
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        ({mailbox._count.messages})
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {!mailbox.isDivider && (
                                  <button
                                    onClick={(e) => handleEditMailbox(mailbox, e)}
                                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 
                                      dark:hover:text-blue-400 dark:hover:bg-blue-900/50 rounded"
                                  >
                                    <box-icon name="edit" size="1.25rem"></box-icon>
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleDeleteMailbox(mailbox.id, e)}
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 
                                    dark:hover:text-red-400 dark:hover:bg-red-900/50 rounded"
                                >
                                  <box-icon name="trash" size="1.25rem"></box-icon>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContextWrapper>

            {/* Add buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsMailboxModalOpen(true)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 
                  rounded-lg text-sm font-medium transition-colors"
              >
                + {t('mailbox')}
              </button>
              <button
                onClick={() => handleAddDivider()}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                  px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 
                  dark:hover:bg-gray-700 transition-colors"
              >
                + {t('divider')}
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Mailbox Form Modal */}
      <Modal 
        isOpen={isMailboxModalOpen} 
        onClose={() => {
          setIsMailboxModalOpen(false)
          setEditingMailbox(null)
        }}
        title={editingMailbox ? t('editMailbox') : t('addMailbox')}
      >
        <MailboxForm
          editMailbox={editingMailbox}
          onClose={() => {
            setIsMailboxModalOpen(false)
            setEditingMailbox(null)
          }}
          onMailboxesChange={handleMailboxUpdate}
        />
      </Modal>
    </aside>
  )
} 