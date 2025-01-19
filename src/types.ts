export type Status = 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'purple'

export interface Item {
  id: number
  name: string
  description?: string
  status: Status
  iconName: string
  order: number
  groupId: number | null
  group?: {
    id: number
    name: string
  } | null
  createdAt: Date
  updatedAt: Date
  dueAt?: Date | null
  useStatusColor?: boolean
}

export interface ItemCreateInput {
  name: string
  description?: string
  status: Status
  iconName: string
  groupId?: number | null
  dueAt?: Date | null
}

export interface ItemUpdateInput {
  name?: string
  description?: string
  status?: Status
  iconName?: string
  groupId?: number | null
  dueAt?: Date | null
}

export interface Group {
  id: number
  name: string
  order: number
  isDivider: boolean
  iconName?: string
  iconColor?: string
  viewMode: 'grid' | 'list' | 'expanded'
  updatedAt?: Date
  _count?: {
    items: number
  }
}

export interface Mailbox {
  id: number
  name: string
  order: number
  isDivider: boolean
  iconName?: string
  iconColor?: string
  viewMode: 'grid' | 'list'
  _count?: {
    messages: number
  }
}

export interface Message {
  id: number
  subject: string
  from: string
  date: Date
  mailboxId: number
  body: string
  flags: string[]
  isUnread: boolean
  hasHtml: boolean
}

export type IconName = 
  | 'home'
  | 'check-square'
  | 'archive'
  | 'send'
  | 'star'
  | 'folder'
  | 'leaf'
  | 'flag'
  | 'bell'
  | 'bookmark'
  | 'heart'
  | 'message'
  | 'calendar'
  | 'error'
  | 'user-pin'
  | 'ghost'
  | 'sushi'
  | undefined; 

interface Settings {
  allSortDirection?: 'asc' | 'desc'
  allSortField?: 'order' | 'createdAt' | 'updatedAt' | 'dueAt'
  ungroupedSortDirection?: 'asc' | 'desc'
  ungroupedSortField?: 'order' | 'createdAt' | 'updatedAt' | 'dueAt'
} 