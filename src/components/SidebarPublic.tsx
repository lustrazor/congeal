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

  // Add new state for search scope
  const [isGlobalSearch, setIsGlobalSearch] = useState(true);

  // Add state for animating icons
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
    localStorage.setItem('publicSelectedGroupId', groupId === undefined ? 'undefined' : String(groupId));
  };

  // Update the search toggle handler
  const handleSearchScopeToggle = () => {
    setIsGlobalSearch(!isGlobalSearch);
    if (!isGlobalSearch) {
      handleGroupSelect(undefined);
    }
  };

  // Add search handler that considers global search mode
  const handleSearch = (query: string) => {
    onSearch(query);
    if (isGlobalSearch && query.length > 0) {
      handleGroupSelect(undefined);
    }
  };

  // Add animation end handler
  const handleAnimationEnd = () => {
    setAnimatingIcon(null)
  }

  // Update the filtered groups logic
  const filteredGroups = groups?.filter((group) => {
    // Hide private groups in public view
    if (group.isPrivate) return false;

    const query = searchQuery.toLowerCase();
    
    // Always show group if its name matches
    const groupNameMatches = group.name.toLowerCase().includes(query);
    if (groupNameMatches) return true;
    
    // For global search, show group if any public item matches
    if (isGlobalSearch) {
      return items?.some(item => 
        // Only check items in public groups
        !groups?.find(g => g.id === item.groupId)?.isPrivate &&
        item.name.toLowerCase().includes(query)
      );
    }
    
    // For group search, only show group if its items match
    return items?.some(
      item => 
        item.groupId === group.id && 
        item.name.toLowerCase().includes(query)
    );
  });

  // Return null after all hooks are called
  if (!settings?.isPublic) {
    return null;
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
    );
  }

  if (isError) {
    return (
      <div className="w-60 lg:w-72 xl:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="text-red-500">Failed to load groups</div>
      </div>
    );
  }

  return (
    <div className="w-60 lg:w-72 xl:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 
      bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto
      bg-[url('/images/dropshadow-sidebar-light.png')] dark:bg-[url('/images/dropshadow-sidebar-dark.png')] 
      bg-top bg-repeat-x transition-all duration-0">
      <div className="mb-2 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full px-3 py-1.5 xl:py-2 text-sm xl:text-base
            bg-white dark:bg-gray-800 
            border border-gray-300 dark:border-gray-600
            rounded-md pl-10"
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

      <nav className="space-y-0 mb-4 tracking-normal text-md font-normal leading-tight">
        <button
          onClick={() => handleGroupSelect(undefined)}
          className={`w-full text-left px-3 pt-1 rounded-lg flex items-center justify-between
            ${selectedGroupId === undefined 
              ? 'bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'
            }`}
        >
          {t('showAll')}
        </button>

        <button
          onClick={() => handleGroupSelect(null)}
          className={`w-full text-left px-3 pt-1 rounded-lg flex items-center justify-between
            ${selectedGroupId === null 
              ? 'bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'
            }`}
        >
          {t('ungrouped')}
        </button>

        <div className="h-4"></div>

        <div className="space-y-1">
          {filteredGroups?.map((group) => (
            <button
              key={group.id}
              onClick={() => {
                // Only select non-divider groups
                if (!group.isDivider) {
                  onGroupSelect(group.id)
                  setAnimatingIcon(group.id)
                }
              }}
              className={`
                w-full text-left p-2 rounded-lg flex items-center justify-between
                ${group.isDivider ? 'py-0 pointer-events-none' : 'cursor-pointer'}
                ${selectedGroupId === group.id && !group.isDivider
                  ? 'bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'
                }
              `}
            >
              <div className="flex items-center gap-2 flex-1">
                {group.isDivider ? (
                  <div className="h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
                ) : (
                  <>
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
                    <span className="text-gray-900 dark:text-gray-100">
                      {group.name}
                    </span>
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

      <div className="h-0.5 mt-4 flex bg-gray-100 dark:bg-gray-800 rounded-full"></div>
      <div className="h-0.5 mt-1 flex bg-gray-100 dark:bg-gray-800 rounded-full"></div>
    </div>
  );
});

export default SidebarPublic;