/**
 * Tabs Component Usage Examples
 *
 * This file demonstrates all available Tabs variants and features.
 * Import Tabs from '@/components/shared'
 */

import React, { useState } from 'react';
import {
  Tabs,
  Button,
  Card,
  Input,
  Textarea,
  Select,
  Checkbox,
} from '@/components/shared';
import {
  Mail,
  Send,
  Archive,
  Trash2,
  Settings,
  Bell,
  Shield,
  User,
  Zap,
  TrendingUp,
  BarChart3,
  PieChart,
} from 'lucide-react';

export const TabsExamples: React.FC = () => {
  // State management
  const [profileTab, setProfileTab] = useState('account');
  const [analyticsTab, setAnalyticsTab] = useState('overview');
  const [mailTab, setMailTab] = useState('inbox');

  // ============================================
  // SIZES
  // ============================================

  const sizeDemoTabs = [
    {
      id: 'sm-1',
      label: 'Overview',
      content: <div className="text-sm">Small tab content</div>,
    },
    {
      id: 'sm-2',
      label: 'Details',
      content: <div className="text-sm">Small tab content</div>,
    },
  ];

  const mdDemoTabs = [
    {
      id: 'md-1',
      label: 'Overview',
      content: <div>Medium tab content (default)</div>,
    },
    {
      id: 'md-2',
      label: 'Details',
      content: <div>Medium tab content</div>,
    },
  ];

  const lgDemoTabs = [
    {
      id: 'lg-1',
      label: 'Overview',
      content: <div className="text-lg">Large tab content</div>,
    },
    {
      id: 'lg-2',
      label: 'Details',
      content: <div className="text-lg">Large tab content</div>,
    },
  ];

  // ============================================
  // VARIANTS
  // ============================================

  const variantTabs = [
    { id: 'v1', label: 'Default Tab 1', content: <div>Content for tab 1</div> },
    { id: 'v2', label: 'Default Tab 2', content: <div>Content for tab 2</div> },
    { id: 'v3', label: 'Default Tab 3', content: <div>Content for tab 3</div> },
  ];

  // ============================================
  // WITH ICONS
  // ============================================

  const iconTabs = [
    {
      id: 'icon-1',
      label: 'Account',
      icon: <User className="w-5 h-5" />,
      content: <div>Account settings and preferences</div>,
    },
    {
      id: 'icon-2',
      label: 'Security',
      icon: <Shield className="w-5 h-5" />,
      content: <div>Security and privacy options</div>,
    },
    {
      id: 'icon-3',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      content: <div>Notification preferences</div>,
    },
  ];

  // ============================================
  // WITH BADGES
  // ============================================

  const badgeTabs = [
    {
      id: 'badge-1',
      label: 'Inbox',
      icon: <Mail className="w-5 h-5" />,
      badge: 5,
      content: <div>5 unread messages</div>,
    },
    {
      id: 'badge-2',
      label: 'Sent',
      icon: <Send className="w-5 h-5" />,
      badge: 12,
      content: <div>12 sent messages</div>,
    },
    {
      id: 'badge-3',
      label: 'Archive',
      icon: <Archive className="w-5 h-5" />,
      badge: 24,
      content: <div>24 archived messages</div>,
    },
    {
      id: 'badge-4',
      label: 'Trash',
      icon: <Trash2 className="w-5 h-5" />,
      badge: 3,
      content: <div>3 deleted messages</div>,
    },
  ];

  // ============================================
  // DISABLED TABS
  // ============================================

  const disabledTabs = [
    { id: 'dis-1', label: 'Enabled', content: <div>This tab is enabled</div> },
    {
      id: 'dis-2',
      label: 'Disabled',
      content: <div>You cannot see this</div>,
      disabled: true,
      description: 'Requires premium subscription',
    },
    { id: 'dis-3', label: 'Enabled', content: <div>This tab is enabled</div> },
    {
      id: 'dis-4',
      label: 'Coming Soon',
      content: <div>Not available yet</div>,
      disabled: true,
    },
  ];

  // ============================================
  // FORM IN TABS
  // ============================================

  const settingsTabs = [
    {
      id: 'settings-account',
      label: 'Account',
      icon: <User className="w-5 h-5" />,
      content: (
        <Card variant="flat" className="mt-4 max-w-2xl">
          <Card.Header>Account Settings</Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Full Name
                </label>
                <Input type="text" placeholder="John Doe" defaultValue="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Email Address
                </label>
                <Input type="email" placeholder="john@example.com" defaultValue="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Phone Number
                </label>
                <Input type="tel" placeholder="+1 (555) 000-0000" />
              </div>
            </div>
          </Card.Body>
          <Card.Footer justify="end">
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary">Save Changes</Button>
          </Card.Footer>
        </Card>
      ),
    },
    {
      id: 'settings-security',
      label: 'Security',
      icon: <Shield className="w-5 h-5" />,
      content: (
        <Card variant="flat" className="mt-4 max-w-2xl">
          <Card.Header>Security Settings</Card.Header>
          <Card.Body>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-900 dark:text-white">
                    Two-Factor Authentication
                  </label>
                  <span className="text-xs bg-success/20 text-success px-2 py-1 rounded">Enabled</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Protect your account with an additional verification step
                </p>
                <Button variant="secondary" size="sm">
                  Manage 2FA
                </Button>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                  Change Password
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Update your password regularly to keep your account secure
                </p>
                <Button variant="secondary" size="sm">
                  Change Password
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      ),
    },
    {
      id: 'settings-notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      content: (
        <Card variant="flat" className="mt-4 max-w-2xl">
          <Card.Header>Notification Preferences</Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <Checkbox
                label="Email Notifications"
                description="Receive email updates about your account"
                defaultChecked
              />
              <Checkbox
                label="Push Notifications"
                description="Receive browser push notifications"
                defaultChecked
              />
              <Checkbox label="SMS Notifications" description="Receive text message alerts" />
            </div>
          </Card.Body>
          <Card.Footer justify="end">
            <Button variant="primary">Save Preferences</Button>
          </Card.Footer>
        </Card>
      ),
    },
  ];

  // ============================================
  // ANALYTICS DASHBOARD
  // ============================================

  const analyticsTabs = [
    {
      id: 'analytics-overview',
      label: 'Overview',
      icon: <TrendingUp className="w-5 h-5" />,
      content: (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Card variant="default" className="text-center">
            <Card.Body>
              <div className="text-3xl font-bold text-primary">1,234</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Visitors</p>
            </Card.Body>
          </Card>
          <Card variant="default" className="text-center">
            <Card.Body>
              <div className="text-3xl font-bold text-success">$12,456</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
            </Card.Body>
          </Card>
          <Card variant="default" className="text-center">
            <Card.Body>
              <div className="text-3xl font-bold text-warning">8.5%</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Conversion Rate</p>
            </Card.Body>
          </Card>
          <Card variant="default" className="text-center">
            <Card.Body>
              <div className="text-3xl font-bold text-info">245</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg. Session</p>
            </Card.Body>
          </Card>
        </div>
      ),
    },
    {
      id: 'analytics-traffic',
      label: 'Traffic',
      icon: <BarChart3 className="w-5 h-5" />,
      content: (
        <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <p className="text-center text-slate-600 dark:text-slate-400">Traffic analytics chart</p>
        </div>
      ),
    },
    {
      id: 'analytics-revenue',
      label: 'Revenue',
      icon: <PieChart className="w-5 h-5" />,
      content: (
        <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <p className="text-center text-slate-600 dark:text-slate-400">Revenue analytics chart</p>
        </div>
      ),
    },
  ];

  // ============================================
  // MAIL CLIENT
  // ============================================

  const mailClientTabs = [
    {
      id: 'mail-inbox',
      label: 'Inbox',
      icon: <Mail className="w-5 h-5" />,
      badge: 5,
      content: (
        <div className="space-y-2 mt-4">
          <Card variant="flat" className="cursor-pointer hover:bg-primary/5">
            <Card.Header>Re: Project Update</Card.Header>
          </Card>
          <Card variant="flat" className="cursor-pointer hover:bg-primary/5">
            <Card.Header>Team Meeting Tomorrow</Card.Header>
          </Card>
          <Card variant="flat" className="cursor-pointer hover:bg-primary/5">
            <Card.Header>New Feature Request</Card.Header>
          </Card>
        </div>
      ),
    },
    {
      id: 'mail-sent',
      label: 'Sent',
      icon: <Send className="w-5 h-5" />,
      badge: 12,
      content: (
        <div className="space-y-2 mt-4">
          <Card variant="flat">
            <Card.Header>Sent: Status Update</Card.Header>
          </Card>
          <Card variant="flat">
            <Card.Header>Sent: Proposal Review</Card.Header>
          </Card>
        </div>
      ),
    },
    {
      id: 'mail-archive',
      label: 'Archive',
      icon: <Archive className="w-5 h-5" />,
      badge: 24,
      content: (
        <div className="space-y-2 mt-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">24 archived emails</p>
        </div>
      ),
    },
  ];

  // ============================================
  // LAZY LOADING TABS
  // ============================================

  const lazyTabs = [
    {
      id: 'lazy-1',
      label: 'Fast Content',
      content: <div>This loads immediately</div>,
      lazy: false,
    },
    {
      id: 'lazy-2',
      label: 'Lazy Loaded',
      content: (
        <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <p>This content only renders when you click this tab (lazy loading)</p>
        </div>
      ),
      lazy: true,
    },
    {
      id: 'lazy-3',
      label: 'Heavy Component',
      content: (
        <div className="mt-4">
          <p className="mb-4">This heavy component only loads when needed</p>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} variant="flat">
                <Card.Body>Item {i}</Card.Body>
              </Card>
            ))}
          </div>
        </div>
      ),
      lazy: true,
    },
  ];

  // ============================================
  // FULL WIDTH TABS
  // ============================================

  const fullWidthTabs = [
    { id: 'fw-1', label: 'Option 1', content: <div>Full width content 1</div> },
    { id: 'fw-2', label: 'Option 2', content: <div>Full width content 2</div> },
    { id: 'fw-3', label: 'Option 3', content: <div>Full width content 3</div> },
    { id: 'fw-4', label: 'Option 4', content: <div>Full width content 4</div> },
  ];

  return (
    <div className="space-y-12 p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* ============================================ */}
      {/* SIZES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Tab Sizes</h2>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Small</p>
            <Tabs size="sm" items={sizeDemoTabs} activeTab="sm-1" />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Medium (default)</p>
            <Tabs size="md" items={mdDemoTabs} activeTab="md-1" />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Large</p>
            <Tabs size="lg" items={lgDemoTabs} activeTab="lg-1" />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* VARIANTS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Tab Variants</h2>

        <div className="space-y-8">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Default (Line)</p>
            <Tabs variant="default" items={variantTabs} activeTab="v1" />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Outlined</p>
            <Tabs variant="outlined" items={variantTabs} activeTab="v1" />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Pill</p>
            <Tabs variant="pill" items={variantTabs} activeTab="v1" />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* WITH ICONS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Tabs with Icons</h2>

        <Tabs size="md" items={iconTabs} activeTab="icon-1" />
      </section>

      {/* ============================================ */}
      {/* WITH BADGES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Tabs with Badges (Notifications)
        </h2>

        <Tabs
          size="md"
          variant="default"
          items={badgeTabs}
          activeTab="badge-1"
          onChange={setMailTab}
        />
      </section>

      {/* ============================================ */}
      {/* DISABLED TABS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Disabled Tabs</h2>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Some tabs are disabled and cannot be clicked. Hover over them to see descriptions.
        </p>
        <Tabs size="md" items={disabledTabs} activeTab="dis-1" />
      </section>

      {/* ============================================ */}
      {/* FORM PATTERN */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Form Pattern - Settings Dashboard
        </h2>

        <Card variant="elevated" className="max-w-4xl">
          <Card.Header>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">User Settings</h3>
          </Card.Header>

          <Card.Body>
            <Tabs
              variant="default"
              size="md"
              items={settingsTabs}
              activeTab={profileTab}
              onChange={setProfileTab}
              showContent
            />
          </Card.Body>
        </Card>
      </section>

      {/* ============================================ */}
      {/* ANALYTICS DASHBOARD */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Analytics Dashboard
        </h2>

        <Card variant="elevated" className="max-w-4xl">
          <Card.Header>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Performance Metrics</h3>
          </Card.Header>

          <Card.Body>
            <Tabs
              variant="default"
              size="md"
              items={analyticsTabs}
              activeTab={analyticsTab}
              onChange={setAnalyticsTab}
              showContent
            />
          </Card.Body>
        </Card>
      </section>

      {/* ============================================ */}
      {/* MAIL CLIENT PATTERN */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Mail Client Pattern
        </h2>

        <Card variant="elevated" className="max-w-2xl">
          <Card.Header>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Email Client</h3>
          </Card.Header>

          <Card.Body>
            <Tabs
              variant="default"
              size="md"
              items={mailClientTabs}
              activeTab={mailTab}
              onChange={setMailTab}
              showContent
            />
          </Card.Body>
        </Card>
      </section>

      {/* ============================================ */}
      {/* LAZY LOADING */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Lazy Loading Content
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Tabs marked as lazy only render their content when activated. Open DevTools to verify.
        </p>

        <Tabs
          variant="default"
          size="md"
          items={lazyTabs}
          activeTab="lazy-1"
        />
      </section>

      {/* ============================================ */}
      {/* FULL WIDTH TABS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Full Width Tabs</h2>

        <Tabs
          variant="default"
          size="md"
          items={fullWidthTabs}
          activeTab="fw-1"
          fullWidth
          wrapperClassName="mb-4"
        />
      </section>

      {/* ============================================ */}
      {/* KEYBOARD NAVIGATION */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Keyboard Navigation
        </h2>

        <Card variant="flat" size="lg" className="mb-4">
          <Card.Header>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Try these keyboard shortcuts:
            </h3>
          </Card.Header>

          <Card.Body>
            <ul className="space-y-2 text-sm">
              <li>
                <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs font-mono">
                  →
                </kbd>
                {' '}Next tab
              </li>
              <li>
                <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs font-mono">
                  ←
                </kbd>
                {' '}Previous tab
              </li>
              <li>
                <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs font-mono">
                  Home
                </kbd>
                {' '}First tab
              </li>
              <li>
                <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs font-mono">
                  End
                </kbd>
                {' '}Last tab
              </li>
            </ul>
          </Card.Body>
        </Card>

        <Tabs
          variant="default"
          size="md"
          items={iconTabs}
          activeTab="icon-1"
          allowKeyboardNav
        />
      </section>
    </div>
  );
};

export default TabsExamples;

/**
 * USAGE GUIDE
 *
 * 1. Basic Tabs
 *    const tabs = [
 *      { id: '1', label: 'Tab 1', content: <div>Content 1</div> },
 *      { id: '2', label: 'Tab 2', content: <div>Content 2</div> },
 *    ];
 *    <Tabs items={tabs} activeTab="1" onChange={(id) => console.log(id)} />
 *
 * 2. With Icons
 *    { id: '1', label: 'Home', icon: <Home />, content: ... }
 *
 * 3. With Badges
 *    { id: '1', label: 'Inbox', badge: 5, content: ... }
 *
 * 4. Lazy Loading
 *    { id: '1', label: 'Heavy', content: <HeavyComponent />, lazy: true }
 *
 * 5. Disabled Tabs
 *    { id: '1', label: 'Disabled', content: ..., disabled: true }
 *
 * 6. Variant Options
 *    <Tabs variant="default" /> - Line style
 *    <Tabs variant="outlined" /> - Box style
 *    <Tabs variant="pill" /> - Rounded pill style
 *
 * 7. Full Width
 *    <Tabs fullWidth items={tabs} />
 *
 * 8. Custom Sizing
 *    <Tabs size="sm" items={tabs} /> - sm, md, lg
 */
