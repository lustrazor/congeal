import { Group, Item, Status } from '@/types'
import { useDebugStore } from '@/stores/debugStore'
import { mutate } from 'swr'
import { SWRKeys } from '@/lib/swr-keys'

// Helper function to revalidate all relevant caches
const revalidateItems = async (groupId?: number | null) => {
  // Revalidate the specific group view if we have a groupId
  if (groupId !== undefined) {
    await mutate(SWRKeys.items(groupId))
  }
  // Always revalidate the all items view
  await mutate(SWRKeys.items())
  // Revalidate groups to update counts
  await mutate(SWRKeys.groups)
}

export async function createGroup(name: string): Promise<Group> {
  const debugStore = useDebugStore.getState()
  const command = { type: 'CREATE_GROUP', data: { name } }
  debugStore.setCommandLog(command)

  try {
    const response = await fetch('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error('Failed to create group')
    }

    debugStore.setResponseLog(data)
    return data
  } catch (error) {
    debugStore.setResponseLog({ error: String(error) })
    debugStore.setLoading(false)
    throw error
  }
}

interface CreateItemData {
  name: string
  status: Status
  groupId?: number
  iconId?: number
}

export async function createItem(data: CreateItemData): Promise<Item> {
  const debugStore = useDebugStore.getState()
  const command = { type: 'CREATE_ITEM', data }
  debugStore.setCommandLog(command)

  try {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const responseData = await response.json()
    
    if (!response.ok) {
      throw new Error('Failed to create item')
    }

    debugStore.setResponseLog(responseData)
    await revalidateItems(data.groupId)
    return responseData
  } catch (error) {
    debugStore.setResponseLog({ error: String(error) })
    debugStore.setLoading(false)
    throw error
  }
} 