/**
 * Card Component Usage Examples
 * 
 * This file demonstrates all available Card variants, sizes, and patterns.
 * Import Card from '@/components/shared'
 */

import React, { useState } from 'react';
import { Card, Button, Input } from '@/components/shared';
import { 
  TrendingUp, 
  Users, 
  Settings, 
  ChevronRight,
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export const CardExamples: React.FC = () => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  return (
    <div className="space-y-12 p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* ============================================ */}
      {/* VARIANTS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Card Variants</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Default */}
          <Card variant="default">
            <Card.Header>Default</Card.Header>
            <Card.Body>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Standard card with subtle shadow
              </p>
            </Card.Body>
          </Card>

          {/* Elevated */}
          <Card variant="elevated">
            <Card.Header>Elevated</Card.Header>
            <Card.Body>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Prominent card with strong shadow
              </p>
            </Card.Body>
          </Card>

          {/* Flat */}
          <Card variant="flat">
            <Card.Header>Flat</Card.Header>
            <Card.Body>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No shadow, subtle background
              </p>
            </Card.Body>
          </Card>

          {/* Outlined */}
          <Card variant="outlined">
            <Card.Header>Outlined</Card.Header>
            <Card.Body>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Border emphasis, no shadow
              </p>
            </Card.Body>
          </Card>
        </div>
      </section>

      {/* ============================================ */}
      {/* SIZES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Card Sizes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="default" size="sm">
            <Card.Header>Small</Card.Header>
            <Card.Body>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Compact padding (p-4)
              </p>
            </Card.Body>
          </Card>

          <Card variant="default" size="md">
            <Card.Header>Medium</Card.Header>
            <Card.Body>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Default padding (p-6)
              </p>
            </Card.Body>
          </Card>

          <Card variant="default" size="lg">
            <Card.Header>Large</Card.Header>
            <Card.Body>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Spacious padding (p-8 lg:p-10)
              </p>
            </Card.Body>
          </Card>
        </div>
      </section>

      {/* ============================================ */}
      {/* WITH HEADER & FOOTER */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Card with Header & Footer</h2>
        
        <div className="max-w-2xl">
          <Card variant="default">
            <Card.Header trailing={<Star size={18} className="text-amber-400" />}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Premium Feature</h3>
            </Card.Header>

            <Card.Body>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                This card demonstrates the complete structure with header, body, and footer sections.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-slate-500">✓ Full structure support</p>
                <p className="text-sm text-slate-500">✓ Flexible layouts</p>
                <p className="text-sm text-slate-500">✓ Interactive options</p>
              </div>
            </Card.Body>

            <Card.Footer justify="end">
              <Button variant="secondary" size="sm">Cancel</Button>
              <Button variant="primary" size="sm">Confirm</Button>
            </Card.Footer>
          </Card>
        </div>
      </section>

      {/* ============================================ */}
      {/* INTERACTIVE CARDS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Interactive Cards</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['analytics', 'settings', 'reports', 'integrations'].map((id) => (
            <Card
              key={id}
              variant="default"
              interactive
              hoverOverlay
              onClick={() => setSelectedCard(selectedCard === id ? null : id)}
              className={selectedCard === id ? 'ring-2 ring-primary' : ''}
            >
              <Card.Header trailing={<ChevronRight size={20} className="text-slate-400" />}>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                  {id === 'analytics' && 'Analytics'}
                  {id === 'settings' && 'Settings'}
                  {id === 'reports' && 'Reports'}
                  {id === 'integrations' && 'Integrations'}
                </h3>
              </Card.Header>

              <Card.Body>
                <p className="text-slate-600 dark:text-slate-400">
                  {id === 'analytics' && 'View real-time analytics and insights'}
                  {id === 'settings' && 'Manage your preferences and configuration'}
                  {id === 'reports' && 'Generate and download reports'}
                  {id === 'integrations' && 'Connect external services and tools'}
                </p>
              </Card.Body>
            </Card>
          ))}
        </div>

        {selectedCard && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-900 dark:text-blue-200">
              Selected: <strong>{selectedCard}</strong>
            </p>
          </div>
        )}
      </section>

      {/* ============================================ */}
      {/* METRIC CARDS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Metric Cards Grid</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total Customers', value: '1,234', trend: '+5.2%' },
            { icon: TrendingUp, label: 'Revenue', value: '₹45.2L', trend: '+12.1%' },
            { icon: CheckCircle, label: 'Orders Completed', value: '892', trend: '+8.3%' },
            { icon: AlertCircle, label: 'Pending Orders', value: '23', trend: '-2.1%' },
          ].map((metric, i) => {
            const Icon = metric.icon;
            return (
              <Card key={i} variant="flat" size="md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {metric.label}
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {metric.value}
                    </p>
                    <p className={`text-xs font-bold mt-2 ${
                      metric.trend.startsWith('+') ? 'text-success' : 'text-danger'
                    }`}>
                      {metric.trend}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon size={24} className="text-primary" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ============================================ */}
      {/* FORM CARD */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Form Card</h2>
        
        <Card variant="elevated" size="lg" className="max-w-md">
          <Card.Header>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create New Customer</h3>
          </Card.Header>

          <Card.Body>
            <div className="space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="john@example.com"
                required
              />

              <Input
                label="Phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
              />

              <Input
                label="Company"
                placeholder="Company Name"
              />
            </div>
          </Card.Body>

          <Card.Footer justify="end">
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary">Create Customer</Button>
          </Card.Footer>
        </Card>
      </section>

      {/* ============================================ */}
      {/* FULL HEIGHT CARDS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Full Height Cards</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-64">
          {['Chart', 'Metrics', 'Activity'].map((title) => (
            <Card key={title} variant="default" fullHeight>
              <Card.Header>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
              </Card.Header>

              <Card.Body scrollable>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Full height cards are useful for layouts with multiple columns.
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li>✓ Fill available height</li>
                  <li>✓ Scrollable body</li>
                  <li>✓ Perfect for dashboards</li>
                  <li>✓ Equal column heights</li>
                </ul>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* COMMON PATTERNS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Common Patterns</h2>
        
        {/* Status Card */}
        <div className="mb-8 max-w-md">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Status Card</h3>
          <Card variant="flat" size="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle size={24} className="text-success" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">All Systems Operational</p>
                <p className="text-sm text-slate-500">Last updated 2 minutes ago</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Product Card */}
        <div className="max-w-sm">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Product Card</h3>
          <Card variant="outlined">
            <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded mb-4 flex items-center justify-center">
              <span className="text-slate-400">Image</span>
            </div>

            <Card.Body className="pt-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Product Name</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Brief product description goes here
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">$99</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                  ))}
                </div>
              </div>
            </Card.Body>

            <Card.Footer>
              <Button variant="secondary" fullWidth>Add to Cart</Button>
            </Card.Footer>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default CardExamples;

/**
 * USAGE GUIDE
 * 
 * 1. Basic Card
 *    <Card>
 *      <Card.Header>Title</Card.Header>
 *      <Card.Body>Content</Card.Body>
 *    </Card>
 * 
 * 2. With Variant
 *    <Card variant="elevated">Content</Card>
 * 
 * 3. With Size
 *    <Card size="lg">Content</Card>
 * 
 * 4. Interactive Card
 *    <Card interactive onClick={handleClick}>
 *      Content
 *    </Card>
 * 
 * 5. With Trailing Element
 *    <Card.Header trailing={<Icon />}>Title</Card.Header>
 * 
 * 6. Complete Structure
 *    <Card>
 *      <Card.Header>Title</Card.Header>
 *      <Card.Body scrollable>Content</Card.Body>
 *      <Card.Footer justify="end">
 *        <Button>Action</Button>
 *      </Card.Footer>
 *    </Card>
 * 
 * 7. Full Height
 *    <Card fullHeight>Content</Card>
 * 
 * 8. Custom Padding
 *    <Card paddingClassName="p-12">Content</Card>
 * 
 * 9. Hover Overlay
 *    <Card interactive hoverOverlay>Content</Card>
 * 
 * 10. Multiple Variants
 *     <Card variant="default | elevated | flat | outlined">
 *       Content
 *     </Card>
 */
