/**
 * TABS COMPONENT
 *
 * Tab navigation with:
 * - 2 variants (default line-based, outlined box-style)
 * - 3 sizes (sm, md, lg)
 * - Active tab tracking and styling
 * - Keyboard navigation (Arrow Left/Right)
 * - Disabled tab support
 * - Icon support with labels
 * - Lazy/deferred content rendering
 * - Badge support on tab labels
 * - Full dark mode support
 * - Accessibility features (role="tablist", aria-selected, etc.)
 *
 * Import: import { Tabs } from '@/components/shared'
 */

import React, { forwardRef, useState, useCallback, useMemo } from 'react';

// ============================================
// TYPES
// ============================================

export type TabVariant = 'default' | 'outlined' | 'pill';

export type TabSize = 'sm' | 'md' | 'lg';

export interface TabItem {
  /** Unique tab identifier */
  id: string;

  /** Tab label/title */
  label: string;

  /** Tab content (React node) */
  content: React.ReactNode;

  /** Optional icon (React component or string) */
  icon?: React.ReactNode;

  /** Optional badge text (e.g., "3" for notifications) */
  badge?: string | number;

  /** Disable this tab */
  disabled?: boolean;

  /** Tab description (shown in tooltip or help text) */
  description?: string;

  /** Lazy load content (only render when active) */
  lazy?: boolean;
}

export interface TabsProps {
  /** Array of tab items */
  items: TabItem[];

  /** Currently active tab ID */
  activeTab?: string;

  /** Callback when tab changes */
  onChange?: (tabId: string) => void;

  /** Tab styling variant */
  variant?: TabVariant;

  /** Tab size */
  size?: TabSize;

  /** Full width tab bar */
  fullWidth?: boolean;

  /** Hide/show tab content area */
  showContent?: boolean;

  /** Custom wrapper class name */
  wrapperClassName?: string;

  /** Custom tab bar class name */
  tabBarClassName?: string;

  /** Custom content area class name */
  contentClassName?: string;

  /** Allow keyboard navigation (arrow keys) */
  allowKeyboardNav?: boolean;
}

// ============================================
// SIZE CLASSES
// ============================================

const sizeClasses: Record<TabSize, { tab: string; icon: string; badge: string; text: string }> =
  {
    sm: {
      tab: 'px-3 py-2',
      icon: 'w-4 h-4',
      badge: 'text-xs px-1.5 py-0.5',
      text: 'text-xs font-medium',
    },
    md: {
      tab: 'px-4 py-3',
      icon: 'w-5 h-5',
      badge: 'text-sm px-2 py-1',
      text: 'text-sm font-semibold',
    },
    lg: {
      tab: 'px-6 py-4',
      icon: 'w-6 h-6',
      badge: 'text-base px-2.5 py-1.5',
      text: 'text-base font-semibold',
    },
  };

// ============================================
// VARIANT CLASSES
// ============================================

const variantClasses: Record<
  TabVariant,
  {
    tabBar: string;
    tab: string;
    activeTab: string;
    inactiveTab: string;
  }
> = {
  default: {
    tabBar: 'border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
    tab: 'relative transition-all border-b-2 -mb-1 hover:text-primary dark:hover:text-primary',
    activeTab:
      'border-b-primary text-primary dark:text-primary font-semibold hover:bg-primary/5 dark:hover:bg-primary/10',
    inactiveTab:
      'border-b-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
  },
  outlined: {
    tabBar: 'border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800',
    tab: 'mx-1 rounded-t-lg border border-b-0 transition-all hover:bg-slate-100 dark:hover:bg-slate-700',
    activeTab:
      'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-primary dark:text-primary font-semibold shadow-sm',
    inactiveTab:
      'border-transparent text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600',
  },
  pill: {
    tabBar: 'gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-full inline-flex',
    tab: 'rounded-full transition-all hover:bg-slate-200 dark:hover:bg-slate-700',
    activeTab:
      'bg-primary text-white dark:text-white font-semibold shadow-md hover:shadow-lg hover:bg-primary/90',
    inactiveTab:
      'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
  },
};

// ============================================
// TABS COMPONENT
// ============================================

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      items,
      activeTab,
      onChange,
      variant = 'default',
      size = 'md',
      fullWidth = false,
      showContent = true,
      wrapperClassName,
      tabBarClassName,
      contentClassName,
      allowKeyboardNav = true,
    },
    ref
  ) => {
    // Default to first non-disabled tab if no activeTab provided
    const initialTab = useMemo(() => {
      if (activeTab) return activeTab;
      const firstEnabled = items.find((item) => !item.disabled);
      return firstEnabled?.id || items[0]?.id;
    }, [activeTab, items]);

    const [internalActiveTab, setInternalActiveTab] = useState(initialTab);
    const effectiveActiveTab = activeTab ?? internalActiveTab;

    // Handle tab change
    const handleTabChange = useCallback(
      (tabId: string) => {
        const tab = items.find((item) => item.id === tabId);
        if (tab && !tab.disabled) {
          if (!activeTab) {
            setInternalActiveTab(tabId);
          }
          onChange?.(tabId);
        }
      },
      [items, activeTab, onChange]
    );

    // Keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!allowKeyboardNav) return;

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();

          const enabledTabs = items.filter((item) => !item.disabled);
          const currentIndex = enabledTabs.findIndex((item) => item.id === effectiveActiveTab);

          let nextIndex = currentIndex;
          if (e.key === 'ArrowLeft') {
            nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
          } else {
            nextIndex = (currentIndex + 1) % enabledTabs.length;
          }

          handleTabChange(enabledTabs[nextIndex].id);
        }

        if (e.key === 'Home') {
          e.preventDefault();
          const firstTab = items.find((item) => !item.disabled);
          if (firstTab) handleTabChange(firstTab.id);
        }

        if (e.key === 'End') {
          e.preventDefault();
          const enabledTabs = items.filter((item) => !item.disabled);
          const lastTab = enabledTabs[enabledTabs.length - 1];
          if (lastTab) handleTabChange(lastTab.id);
        }
      },
      [items, effectiveActiveTab, handleTabChange, allowKeyboardNav]
    );

    const sizeStyle = sizeClasses[size];
    const variantStyle = variantClasses[variant];

    return (
      <div
        ref={ref}
        className={`flex flex-col w-full ${wrapperClassName || ''}`}
        onKeyDown={handleKeyDown}
      >
        {/* Tab Bar */}
        <div
          className={`flex ${
            fullWidth ? 'w-full' : ''
          } overflow-x-auto scroll-smooth ${variantStyle.tabBar} ${tabBarClassName || ''}`}
          role="tablist"
          aria-label="Tabs"
        >
          {items.map((item, index) => {
            const isActive = item.id === effectiveActiveTab;
            const isDisabled = item.disabled;

            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                aria-disabled={isDisabled}
                aria-controls={`tab-content-${item.id}`}
                id={`tab-${item.id}`}
                onClick={() => handleTabChange(item.id)}
                disabled={isDisabled}
                title={item.description}
                className={`
                  flex items-center gap-2 whitespace-nowrap
                  ${sizeStyle.tab}
                  ${variantStyle.tab}
                  ${isActive ? variantStyle.activeTab : variantStyle.inactiveTab}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  disabled:cursor-not-allowed
                  disabled:hover:no-underline
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900
                  transition-all duration-200
                `}
              >
                {/* Icon */}
                {item.icon && (
                  <span className={`flex-shrink-0 ${sizeStyle.icon}`}>{item.icon}</span>
                )}

                {/* Label */}
                <span className={sizeStyle.text}>{item.label}</span>

                {/* Badge */}
                {item.badge !== undefined && (
                  <span
                    className={`
                      flex-shrink-0 ml-1 rounded-full font-bold
                      ${sizeStyle.badge}
                      ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 text-primary'
                          : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                      }
                    `}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {showContent && (
          <div className={`flex-1 ${contentClassName || ''}`}>
            {items.map((item) => {
              const isActive = item.id === effectiveActiveTab;

              // If lazy and not active, don't render
              if (item.lazy && !isActive) {
                return null;
              }

              return (
                <div
                  key={item.id}
                  id={`tab-content-${item.id}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${item.id}`}
                  hidden={!isActive}
                  className={`
                    transition-opacity duration-200
                    ${isActive ? 'opacity-100' : 'opacity-0 hidden'}
                    py-4 px-2
                  `}
                >
                  {item.content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

export default Tabs;

/**
 * USAGE GUIDE
 *
 * 1. Basic Tabs
 *    <Tabs
 *      items={[
 *        { id: '1', label: 'Tab 1', content: <div>Content 1</div> },
 *        { id: '2', label: 'Tab 2', content: <div>Content 2</div> },
 *      ]}
 *      activeTab="1"
 *      onChange={(id) => console.log(id)}
 *    />
 *
 * 2. With Icons and Badges
 *    <Tabs
 *      items={[
 *        { id: '1', label: 'Inbox', icon: <Mail />, badge: 5, content: ... },
 *        { id: '2', label: 'Sent', icon: <Send />, content: ... },
 *      ]}
 *    />
 *
 * 3. Outlined Variant
 *    <Tabs variant="outlined" items={items} />
 *
 * 4. Pill Variant
 *    <Tabs variant="pill" items={items} />
 *
 * 5. With Lazy Loading
 *    <Tabs
 *      items={[
 *        { id: '1', label: 'Tab 1', content: <HeavyComponent />, lazy: true },
 *      ]}
 *    />
 *
 * 6. Disabled Tabs
 *    <Tabs
 *      items={[
 *        { id: '1', label: 'Enabled', content: ... },
 *        { id: '2', label: 'Disabled', content: ..., disabled: true },
 *      ]}
 *    />
 *
 * 7. Full Width
 *    <Tabs fullWidth items={items} />
 *
 * 8. Custom Size
 *    <Tabs size="lg" items={items} />
 */
