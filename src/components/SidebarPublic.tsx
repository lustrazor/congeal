'use client';

import { useState, memo, useMemo, useEffect } from 'react';
import { useGroups } from '@/hooks/useGroups';
import { useItems } from '@/hooks/useItems';
import 'boxicons/css/boxicons.min.css';
import { useTranslations } from '@/hooks/useTranslations';
import { useSettings } from '@/hooks/useSettings';
import { useRouter } from 'next/navigation';

interface SidebarPublicProps {
  selectedGroupId: number | null | undefined;
  onGroupSelect: (groupId: number | null | undefined) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
}

const SidebarPublic = memo(function SidebarPublic({
  selectedGroupId,
  onGroupSelect,
  searchQuery,
  onSearch,
}: SidebarPublicProps) {
  const { groups, isLoading: groupsLoading, isError } = useGroups();
  const { items } = useItems();
  const { t } = useTranslations();
  const { settings, mutate } = useSettings();
  const router = useRouter();

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

  // Redirect if public access is disabled
  useEffect(() => {
    if (settings && !settings.isPublic) {
      router.push('/denied');
    }
  }, [settings?.isPublic, router]);

  // Subscribe to settings changes
  useEffect(() => {
    const subscription = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          mutate(data);
        }
      } catch (error) {
        console.error('Failed to check settings:', error);
      }
    };

    // Set up event source for real-time updates
    const eventSource = new EventSource('/api/settings/subscribe');
    eventSource.onmessage = () => {
      subscription();
    };

    return () => {
      eventSource.close();
    };
  }, [mutate]);

  // Set initial group selection
  useEffect(() => {
    // Only run if we have groups and no selection yet
    if (groups?.length && selectedGroupId === undefined) {
      // Check localStorage first
      const savedGroupId = localStorage.getItem('publicSelectedGroupId');
      if (savedGroupId) {
        // Convert saved ID back to number, null, or undefined
        const parsedId = savedGroupId === 'null' 
          ? null 
          : savedGroupId === 'undefined'
            ? undefined
            : Number(savedGroupId);
        onGroupSelect(parsedId);
      } else {
        // No saved selection, select first non-private group
        const firstPublicGroup = groups.find(g => !g.isPrivate);
        if (firstPublicGroup) {
          onGroupSelect(firstPublicGroup.id);
          localStorage.setItem('publicSelectedGroupId', String(firstPublicGroup.id));
        }
      }
    }
  }, [groups, selectedGroupId, onGroupSelect]);

  // Handle group selection with localStorage
  const handleGroupSelect = (groupId: number | null | undefined) => {
    onGroupSelect(groupId);
    // Store 'undefined' string for Show All
    localStorage.setItem('publicSelectedGroupId', groupId === undefined ? 'undefined' : String(groupId));
  };

  // Return null after all hooks are called
  if (!settings?.isPublic) {
    return null;
  }

  const filteredGroups = groups?.filter((group) => {
    // Hide private groups in public view
    if (group.isPrivate) return false;

    const query = searchQuery.toLowerCase();
    const groupNameMatches = group.name.toLowerCase().includes(query);
    const hasMatchingItems = items?.some(
      (item) => item.groupId === group.id && item.name.toLowerCase().includes(query)
    );
    return groupNameMatches || hasMatchingItems;
  });

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

  return (
    <div 
      className="w-60 lg:w-72 xl:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 
        bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto
        bg-[url('/images/dropshadow-sidebar-light.png')] dark:bg-[url('/images/dropshadow-sidebar-dark.png')] 
        bg-top bg-repeat-x transition-all duration-0"
    >
      {/* Search input - adjust padding/font size for smaller width */}
      <div className="mb-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full px-3 py-1.5 xl:py-2 text-sm xl:text-base
            bg-white dark:bg-gray-800 
            border border-gray-300 dark:border-gray-600
            rounded-md"
        />
      </div>

      {/* Navigation section */}
      <nav className="space-y-0 mb-4 tracking-normal text-md font-normal leading-tight">
        {/* "Show All" button */}
        <button
          onClick={() => handleGroupSelect(undefined)}
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
          onClick={() => handleGroupSelect(null)}
          className={`
            w-full text-left px-3 pt-1 rounded-lg flex items-center justify-between
            ${selectedGroupId === null 
              ? 'bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'
            }
          `}
        >
          {t('ungrouped')}
        </button>

        {/* Spacer div */}
        <div className="h-4"></div>

        {/* Groups list (non-draggable) */}
        <div className="space-y-1">
          {filteredGroups?.map((group) => (
            <button
              key={group.id}
              onClick={() => handleGroupSelect(group.id)}
              className={`
                w-full text-left p-2 rounded-lg flex items-center justify-between
                ${group.isDivider ? 'py-0 cursor-default' : 'cursor-pointer'}
                ${selectedGroupId === group.id 
                  ? 'bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'
                }
                ${group.isPrivate ? 'italic' : ''}
                relative
              `}
            >
              <div className="flex items-center gap-2 flex-1">
                {/* Render divider or group content */}
                {group.isDivider ? (
                  <div className="h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
                ) : (
                  <>
                    {/* Group icon */}
                    {group.iconName && (
                      <i 
                        className={`bx bxs-${group.iconName} text-${group.iconColor}-500`}
                        style={{ fontSize: '1.25rem' }}
                      />
                    )}
                    {/* Group name */}
                    <span className="text-gray-900 dark:text-gray-100">
                      {group.name}
                    </span>
                    {/* Item count */}
                    {groupItemCounts.get(group.id) > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({groupItemCounts.get(group.id)})
                      </span>
                    )}
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </nav>

      {/* Spacer divs */}
      <div className="h-0.5 mt-4 flex bg-gray-100 dark:bg-gray-800 rounded-full"></div>
      <div className="h-0.5 mt-1 flex bg-gray-100 dark:bg-gray-800 rounded-full"></div>
    </div>
  )
})

export default SidebarPublic 