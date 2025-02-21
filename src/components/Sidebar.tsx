'use client';

import { Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import DragDropContextWrapper from './DragDropContextWrapper';
import { useState, memo, useMemo } from 'react';
import Modal from './ui/Modal';
import GroupForm from './forms/GroupForm';
import { useDebugStore } from '@/stores/debugStore';
import { useGroups } from '@/hooks/useGroups';
import { useItems } from '@/hooks/useItems';
import 'boxicons/css/boxicons.min.css';
import { useTranslations } from '@/hooks/useTranslations';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';

interface SidebarProps {
  selectedGroupId: number | null | undefined;
  onGroupSelect: (groupId: number | null | undefined) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  isAnyDragging?: boolean;
  onDragStateChange?: (isDragging: boolean) => void;
}

const Sidebar = memo(function Sidebar({
  selectedGroupId,
  onGroupSelect,
  searchQuery,
  onSearch,
  isAnyDragging,
  onDragStateChange,
}: SidebarProps) {
  const { groups, isLoading: groupsLoading, isError, mutate: mutateGroups } = useGroups();
  const { items, mutate: mutateItems } = useItems();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{
    id: number;
    name: string;
    iconName?: string;
    iconColor?: string;
    isPrivate?: boolean;
  } | null>(null);
  const [hoveredGroupId, setHoveredGroupId] = useState<number | null>(null);
  const debugStore = useDebugStore();
  const { t } = useTranslations();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteButtonPosition, setDeleteButtonPosition] = useState({ x: 0, y: 0 });
  const [deletingGroup, setDeletingGroup] = useState<number | null>(null);
  const [deleteItems, setDeleteItems] = useState(false);

  // Add new state for search
  const [isGlobalSearch, setIsGlobalSearch] = useState(true);

  // Add this state to track which group icon is animating
  const [animatingIcon, setAnimatingIcon] = useState<number | null>(null)

  // Calculate item counts using useMemo
  const groupItemCounts = useMemo(() => {
    if (!items) return new Map<number, number>();
    
    const counts = new Map<number, number>();
    items.forEach(item => {
      if (item.groupId) {
        counts.set(item.groupId, (counts.get(item.groupId) || 0) + 1);
      }
    });
    return counts;
  }, [items]);

  const handleDeleteGroup = async (groupId: number) => {
    try {
      if (deleteItems) {
        await fetch(`/api/groups/${groupId}/items`, { method: 'DELETE' });
      }

      await fetch(`/api/groups/${groupId}?deleteItems=${deleteItems}`, { 
        method: 'DELETE' 
      });

      // Update both groups and items in parallel
      await Promise.all([
        mutateGroups(),
        mutateItems()
      ]);

      if (selectedGroupId === groupId) onGroupSelect(null);
      setShowDeleteConfirm(false);
      setDeletingGroup(null);
      setDeleteItems(false);
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const handleDragStart = () => {
    if (onDragStateChange) {
      onDragStateChange(true);
    }
    debugStore.log('Drag started', { timestamp: new Date().toISOString() });
  };

  const handleDragEnd = async (result: DropResult) => {
    if (onDragStateChange) {
      onDragStateChange(false);
    }
    if (!result.destination || !groups) return;

    const newGroups = Array.from(groups);
    const [removed] = newGroups.splice(result.source.index, 1);
    newGroups.splice(result.destination.index, 0, removed);

    const updatedGroups = newGroups.map((group, index) => ({ ...group, order: index }));
    mutateGroups(updatedGroups, false);

    try {
      await fetch('/api/groups/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: updatedGroups }),
      });
      mutateGroups();
    } catch (error) {
      console.error('Failed to reorder groups:', error);
      mutateGroups();
    }
  };

  const handleAddGroup = () => {
    setEditingGroup(null);
    setIsGroupModalOpen(true);
  };

  const handleAddDivider = async () => {
    try {
      await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '──────────', isDivider: true }),
      });
      await mutateGroups();
    } catch (error) {
      console.error('Error adding divider:', error);
    }
  };

  const handleEditGroup = (group: any) => {
    setEditingGroup(group);
    setIsGroupModalOpen(true);
  };

  // Add this function near the other handlers in the Sidebar component
  const handleUngroupedClick = () => {
    onGroupSelect(null)
    debugStore.log('Selected ungrouped items', {
      type: 'SELECT_UNGROUPED',
      timestamp: new Date().toISOString()
    })
  }

  // Update the filtered groups logic
  const filteredGroups = groups?.filter((group) => {
    const query = searchQuery.toLowerCase();
    
    // Always show group if its name matches
    const groupNameMatches = group.name.toLowerCase().includes(query);
    if (groupNameMatches) return true;
    
    // For global search, show group if any item matches (regardless of group)
    if (isGlobalSearch) {
      return items?.some(item => item.name.toLowerCase().includes(query));
    }
    
    // For group search, only show group if its items match
    return items?.some(
      item => 
        item.groupId === group.id && 
        item.name.toLowerCase().includes(query)
    );
  });

  // Before the handleGroupFormClose function, add a helper:
  const sanitizeForLogging = (data: any) => {
    if (!data) return data;
    const clean = { ...data };
    // Remove any properties that might contain circular references
    delete clean.window;
    delete clean.document;
    delete clean.event;
    return clean;
  };

  // Then update the handleGroupFormClose function:
  const handleGroupFormClose = async (newGroupId?: number) => {
    setIsGroupModalOpen(false);
    setEditingGroup(null);

    if (newGroupId) {
      // Update both groups and items in parallel
      await Promise.all([
        mutateGroups(),
        mutateItems()
      ]);

      // Log with sanitized data
      debugStore.log('Group form closed with new group', {
        type: 'GROUP_FORM_CLOSE',
        groupId: newGroupId,
        timestamp: new Date().toISOString()
      });

      // Select the new group
      onGroupSelect(newGroupId);
    } else {
      // Log simple close without data
      debugStore.log('Group form closed without changes');
    }
  };

  // Add debug logging
  console.log('Sidebar render:', { 
    groupsLoading, 
    groupCount: groups?.length,
    hasGroups: !!groups,
    isError 
  })

  // Update the search toggle handler
  const handleSearchScopeToggle = () => {
    setIsGlobalSearch(!isGlobalSearch);
    // When switching to global search, select "Show All"
    if (!isGlobalSearch) {
      onGroupSelect(undefined);
    }
  };

  // Add search handler that considers global search mode
  const handleSearch = (query: string) => {
    onSearch(query);
    // When typing in global search mode, switch to "Show All"
    if (isGlobalSearch && query.length > 0) {
      onGroupSelect(undefined);
    }
  };

  // Add this handler for animation end
  const handleAnimationEnd = () => {
    setAnimatingIcon(null)
  }

  if (groupsLoading) {
    return (
      <div className="w-60 lg:w-72 xl:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    console.error('Error loading groups:', isError)
    return (
      <div className="w-60 lg:w-72 xl:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="text-red-500">Failed to load groups</div>
      </div>
    )
  }

  // Main sidebar render
  return (
    <>
      {/* Sidebar container with dropshadow effect */}
      <div 
        className="w-60 lg:w-72 xl:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 
          bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto
          bg-[url('/images/dropshadow-sidebar-light.png')] dark:bg-[url('/images/dropshadow-sidebar-dark.png')] 
          bg-top bg-repeat-x transition-all duration-0"
        onMouseEnter={() => setHoveredGroupId(-1)}
        onMouseLeave={() => setHoveredGroupId(null)}
      >
        {/* Search input - adjust padding/font size for smaller width */}
        <div className="mb-2 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full px-3 py-1.5 xl:py-2 text-sm xl:text-base
              bg-white dark:bg-gray-800 
              border border-gray-300 dark:border-gray-600
              rounded-md
              pl-10"
          />
          <button
            onClick={handleSearchScopeToggle}
            className="absolute left-3 top-1/2 -translate-y-1/2
              text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300
              transition-colors duration-200"
            title={isGlobalSearch ? t('searchInGroup') : t('searchGlobally')}
          >
            <i className={`bx ${isGlobalSearch ? 'bx-globe' : 'bx-folder'} text-lg`} />
          </button>
        </div>

        {/* Navigation section */}
        <nav className="space-y-0 mb-4 tracking-normal text-md font-normal leading-tight">
          {/* "Show All" button */}
          <button
            onClick={() => onGroupSelect(undefined)}
            className={`
              w-full text-left px-3 pt-1 rounded-lg flex items-center justify-between
              ${selectedGroupId === undefined 
                ? 'bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'
              }
            `}
          >
            {t('showAll')}
          </button>

          {/* "Ungrouped" button */}
          <button
            onClick={handleUngroupedClick}
            className={`
              w-full text-left px-3 py-1 rounded-lg flex items-center justify-between
              ${selectedGroupId === null 
                ? 'bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'
              }
            `}
          >
            <span>{t('ungrouped')}</span>
          </button>

          {/* Spacer div */}
          <div className="h-4"></div>

          {/* Draggable groups list */}
          <DragDropContextWrapper
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          >
            <Droppable droppableId="groups">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-1"
                >
                  {filteredGroups?.map((group, index) => (
                    <Draggable 
                      key={group.id} 
                      draggableId={`group-${group.id}`} 
                      index={index}
                      isDragDisabled={isAnyDragging}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`
                            p-0 rounded cursor-pointer
                            ${group.isDivider ? 'py-0 cursor-grab' : ''}
                            ${selectedGroupId === group.id && !group.isDivider
                              ? 'bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'
                            }
                            ${snapshot.isDragging ? 'bg-gray-100 dark:bg-gray-800/50 shadow-lg' : ''}
                            ${group.isPrivate ? 'italic' : ''}
                            relative group/item
                          `}
                          onClick={() => {
                            // Only select and animate if not a divider
                            if (!group.isDivider) {
                              onGroupSelect(group.id)
                              setAnimatingIcon(group.id)
                            }
                          }}
                          onMouseEnter={() => setHoveredGroupId(group.id)}
                          onMouseLeave={() => setHoveredGroupId(null)}
                        >
                          {/* Group item content */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              {/* Drag handle */}
                              <div 
                                className={`
                                  text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 
                                  cursor-grab active:cursor-grabbing
                                  transition-opacity duration-0
                                  ${hoveredGroupId === group.id ? 'opacity-100' : 'opacity-0'}
                                `}
                              >
                                <svg className="w-2 h-2 ml-2 mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                              </div>
                              
                              {/* Render divider or group content */}
                              {group.isDivider ? (
                                <div className="h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
                              ) : (
                                <>
                                  {/* Group icon */}
                                  {group.iconName && (
                                    <i 
                                      className={`
                                        bx bxs-${group.iconName} 
                                        text-${group.iconColor}-500
                                        ${animatingIcon === group.id ? 'animate-bump' : ''}
                                      `}
                                      style={{ fontSize: '1.25rem' }}
                                      onAnimationEnd={handleAnimationEnd}
                                    />
                                  )}
                                  {/* Group name */}
                                  <span className="text-gray-900 dark:text-gray-100">
                                    {group.name}
                                  </span>
                                  {/* Private group indicator */}
                                  {group.isPrivate && (
                                    <i 
                                      className="bx bxs-lock-alt text-gray-400 dark:text-gray-500"
                                      style={{ fontSize: '1rem' }}
                                    />
                                  )}
                                  {/* Item count */}
                                  {groupItemCounts.get(group.id) > 0 && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      ({groupItemCounts.get(group.id)})
                                    </span>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Hover action buttons */}
                            <div className={`
                              flex gap-1 transition-opacity duration-0
                              ${hoveredGroupId === group.id ? 'opacity-100' : 'opacity-0'}
                            `}>
                              {/* Edit button */}
                              {!group.isDivider && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditGroup(group)
                                  }}
                                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <i className="bx bx-edit text-lg" />
                                </button>
                              )}
                              {/* Delete button */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    setDeleteButtonPosition({ x: rect.left, y: rect.top })
                                    setDeletingGroup(group.id)
                                    setShowDeleteConfirm(true)
                                  }}
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                  <i className="bx bx-trash text-lg" />
                                </button>

                                {/* Delete Confirmation */}
                                <DeleteConfirmation
                                  isOpen={showDeleteConfirm && deletingGroup === group.id}
                                  onClose={() => {
                                    setShowDeleteConfirm(false)
                                    setDeletingGroup(null)
                                    setDeleteItems(false)
                                  }}
                                  onConfirm={() => {
                                    if (deletingGroup) {
                                      handleDeleteGroup(deletingGroup)
                                    }
                                  }}
                                  message={t('confirmDeleteGroup')}
                                  buttonPosition={deleteButtonPosition}
                                  showDeleteItemsCheckbox={true}
                                  deleteItems={deleteItems}
                                  onDeleteItemsChange={setDeleteItems}
                                  deleteItemsHint={t('deleteGroupItemsHint')}
                                />
                              </div>
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
        </nav>
          {/* Spacer div */}
          <div className="h-0.5 mt-4 flex bg-gray-100 dark:bg-gray-800 rounded-full"></div>
          <div className="h-0.5 mt-1 flex bg-gray-100 dark:bg-gray-800 rounded-full"></div>
        {/* Action buttons - adjust size for smaller width */}
        <div 
          className="relative mt-4 h-100 group/buttons"
          onMouseEnter={() => setHoveredGroupId(-1)}
          onMouseLeave={() => setHoveredGroupId(null)}
        >
        <div className="flex gap-1 py-5 justify-center">
          {/* Add Group button */}
          <button
            onClick={handleAddGroup}
            className={`
              bg-blue-500 text-white 
              pl-4 pr-5 py-1 xl:py-1 xl:pb-1.5 xl:pr-8 xl:pl-7  
              text-sm xl:text-base rounded-lg 
              hover:bg-blue-700 transition-all duration-0
              ${hoveredGroupId === -1 ? 'opacity-100' : 'opacity-0'}
            `}
          >
            {t('addGroup')}
          </button>
          {/* Add Divider button */}
          <button
            onClick={() => handleAddDivider()}
            className={`
              bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
              pl-4 pr-5 py-1 xl:py-1 xl:pb-1.5 xl:pr-8 xl:pl-7 rounded-lg 
              hover:bg-gray-300 dark:hover:bg-gray-600 
              transition-all duration-0 text-sm xl:text-base
              ${hoveredGroupId === -1 ? 'opacity-100' : 'opacity-0'}
            `}
          >
            {t('addDivider')}
          </button>
        </div>
        </div>
      </div>

      {/* Group edit/create modal */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={handleGroupFormClose}
        title={editingGroup ? t('editGroup') : t('createGroup')}
      >
        <GroupForm
          onClose={handleGroupFormClose}
          editGroup={editingGroup}
          onItemsChange={(groupId) => {
            mutateItems(undefined, {
              revalidate: true,
              filter: (key) => key.includes(`groupId=${groupId}`)
            })
          }}
        />
      </Modal>
    </>
  )
})

export default Sidebar 