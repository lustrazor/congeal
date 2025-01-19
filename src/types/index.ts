import { IconName } from '@/components/IconSelector'

export type Status = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'gray'

export interface Group {
  id: number
  name: string
  order: number
  isDivider: boolean
  isPrivate: boolean
  iconName?: string | null
  iconColor: string
  viewMode: 'grid' | 'list'
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  createdAt: string
  updatedAt: string
  _count?: {
    items: number
  }
}

export interface Settings {
  id: number
  title: string
  tagline: string
  isDark: boolean
  headerImage?: string | null
  headerEnabled: boolean
  emailEnabled?: boolean
  allViewMode: 'grid' | 'list' | 'expanded'
  ungroupedViewMode: 'grid' | 'list' | 'expanded'
  showPrivateGroups: boolean
  version: string
  debugMode: boolean
  updatedAt: string
}

export interface Item {
  id: number
  name: string
  description?: string
  status: Status
  iconName: IconName
  useStatusColor?: boolean
  groupId: number | null
  order: number
  dueAt?: Date | null
  group?: Group
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: number
  uid: number
  subject: string
  from: string
  to: string
  date: string
  body?: string
  seen: boolean
  mailboxId: number
  mailbox?: Mailbox
  createdAt: Date
  updatedAt: Date
}

export interface Mailbox {
  id: number
  name: string
  order: number
  isDivider?: boolean
  iconName?: string
  iconColor?: string
  email?: string
  imapHost?: string
  imapPort?: number
  username?: string
  password?: string
  useSSL?: boolean
  useOAuth?: boolean
  _count?: {
    messages: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface Quote {
  id: number
  quote: string
  thinker?: string
  createdAt: Date
  updatedAt: Date
}

export interface Note {
  id: number
  title: string
  content: string
  tags?: string
  createdAt: Date
  updatedAt: Date
} 