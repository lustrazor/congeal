/**
 * API utility functions for interacting with the backend
 */

import { Item } from '@/types'

/**
 * Update an item's properties
 * @param id - Item ID to update
 * @param data - Partial item data to update
 * @returns Promise with the updated item
 */
export const updateItem = async (id: number, data: Partial<Item>) => {
  const response = await fetch(`/api/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      status: data.status,
      groupId: data.groupId,
      iconName: data.iconName
    }),
  })
  
  const responseData = await response.json()
  
  return {
    ok: response.ok,
    data: responseData
  }
}

/**
 * Delete an item
 * @param id - Item ID to delete
 * @returns Promise that resolves when the item is deleted
 */
export const deleteItem = async (id: number) => {
  const response = await fetch(`/api/items/${id}`, {
    method: 'DELETE'
  })
  
  // Parse the response
  const responseData = await response.json()
  
  // Return both the response object and parsed data
  return {
    ok: response.ok,
    data: responseData
  }
}

/**
 * Create a new item
 * @param data - Item data to create
 * @returns Promise with the created item
 */
export const createItem = async (data: Partial<Item>) => {
  // Convert groupId to number if it exists
  const formattedData = {
    ...data,
    groupId: data.groupId ? Number(data.groupId) : null
  }

  const response = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formattedData),
  })
  
  const responseData = await response.json()
  
  return {
    ok: response.ok,
    data: responseData
  }
}

/**
 * Reorder items in a group
 * @param itemId - Item ID to move
 * @param newIndex - New position index
 * @param groupId - Group ID (optional)
 * @returns Promise with the reordered items
 */
export async function reorderItems(itemId: number, newIndex: number, groupId?: number | null) {
  const response = await fetch('/api/items/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, newIndex, groupId }),
  })

  if (!response.ok) {
    throw new Error('Failed to reorder items')
  }

  return response.json()
} 