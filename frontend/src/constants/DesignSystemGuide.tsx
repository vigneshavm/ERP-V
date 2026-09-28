/**
 * DESIGN SYSTEM USAGE GUIDE
 * 
 * This file demonstrates how to use design tokens throughout the application.
 * Follow these patterns to maintain consistency across all components and pages.
 */

import React from 'react';
import { spacing, typography, shadows, radius, sizes, colors } from '@/constants/designTokens';
import { Card, Button, Input } from '@/components/shared';

/**
 * ============================================
 * SPACING EXAMPLES
 * ============================================
 * 
 * Rule: Use spacing scale consistently.
 * Never hardcode 12px, 20px, 6px - use nearest token value.
 */

// GOOD - Using spacing tokens
const SpacingExample = () => (
  <div className="space-y-6">
    {/* space-y-6 = 24px gap (md) */}
    <div className="p-4">
      {/* p-4 = 16px padding (md) */}
      <h2>Section Title</h2>
    </div>

    <div className="px-6 py-4">
      {/* px-6 = 24px horizontal (lg), py-4 = 16px vertical (md) */}
      <p>Content area</p>
    </div>
  </div>
);

// GOOD - Using semantic sizing
const CardWithSpacing = () => (
  <Card size="md">
    {/* Card.md = 16px padding (spacing.md) */}
    <Card.Header>Title</Card.Header>
    <Card.Body>Content</Card.Body>
    <Card.Footer justify="end">
      <Button variant="secondary" size="sm">Cancel</Button>
      <Button variant="primary" size="sm">Save</Button>
    </Card.Footer>
  </Card>
);

/**
 * ============================================
 * BORDER RADIUS EXAMPLES
 * ============================================
 * 
 * Rule: Use only 3 standard values (sm/md/lg).
 * sm = 4px, md = 8px (default), lg = 16px (rare)
 */

// GOOD - Standard rounding
const RadiusExample = () => (
  <div className="space-y-4">
    {/* Tailwind rounded-lg = 8px (default for most) */}
    <Card variant="default" className="rounded-lg">
      <Card.Body>Most cards use rounded-lg</Card.Body>
    </Card>

    {/* Tailwind rounded-2xl = 4px (for smaller components) */}
    <Button className="rounded-2xl" variant="primary">
      Buttons use rounded-2xl
    </Button>

    {/* Tailwind rounded-3xl = 16px (rare, large cards only) */}
    <Card variant="elevated" className="rounded-3xl">
      <Card.Body>Rarely used, very prominent containers</Card.Body>
    </Card>
  </div>
);

/**
 * ============================================
 * TYPOGRAPHY EXAMPLES
 * ============================================
 * 
 * Rule: Use heading levels h1-h4 for titles, body/small for text.
 * Never set arbitrary fontSize values.
 */

// GOOD - Semantic headings
const TypographyExample = () => (
  <div className="space-y-6">
    {/* Page title */}
    <h1 className="text-2xl font-black" style={{ lineHeight: '2.5rem' }}>
      Main Page Title
    </h1>

    {/* Section title */}
    <h2 className="text-xl font-bold" style={{ lineHeight: '2rem' }}>
      Section Heading
    </h2>

    {/* Subsection title */}
    <h3 className="text-lg font-bold" style={{ lineHeight: '1.75rem' }}>
      Subsection Heading
    </h3>

    {/* Card title */}
    <h4 className="text-base font-semibold">Card Title</h4>

    {/* Body text - most common */}
    <p className="text-sm">Regular paragraph text in 14px</p>

    {/* Small helper text */}
    <p className="text-xs text-slate-500">Helper text or label in 12px</p>
  </div>
);

/**
 * ============================================
 * SHADOW / ELEVATION EXAMPLES
 * ============================================
 * 
 * Rule: sm for cards, md for hover, lg for modals, xl for dropdowns.
 * Use shadows.*.tailwind for className.
 */

// GOOD - Elevation hierarchy
const ShadowExample = () => (
  <div className="space-y-4">
    {/* Level 1 - Subtle */}
    <Card variant="default" className="shadow-sm">
      <Card.Body>At-rest card with shadow-sm</Card.Body>
    </Card>

    {/* Level 2 - Hover state */}
    <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      Hover to see elevation increase (shadow-md → shadow-lg)
    </div>

    {/* Level 3 - Modal */}
    <div className="p-6 bg-white rounded-lg shadow-lg">
      Modal window with shadow-lg
    </div>

    {/* Level 4 - Dropdown/Floating */}
    <div className="p-4 bg-white rounded-lg shadow-xl">
      Dropdown menu with shadow-xl
    </div>
  </div>
);

/**
 * ============================================
 * COLOR EXAMPLES
 * ============================================
 * 
 * Rule: Use CSS variables (--color-*) for semantic colors.
 * Never hardcode #colors or tailwind color names.
 */

// GOOD - Using semantic colors
const ColorExample = () => (
  <div className="space-y-4">
    {/* Primary action */}
    <Button variant="primary">Primary Action</Button>

    {/* Success state */}
    <Button variant="success">Success</Button>

    {/* Warning state */}
    <Button variant="warning">Warning</Button>

    {/* Danger/Destructive */}
    <Button variant="danger">Delete</Button>

    {/* Text colors */}
    <div className="space-y-2">
      <p className="text-slate-900 dark:text-white">Primary text</p>
      <p className="text-slate-600 dark:text-slate-400">Secondary text</p>
      <p className="text-slate-500 dark:text-slate-500">Muted text</p>
    </div>
  </div>
);

/**
 * ============================================
 * SIZE EXAMPLES
 * ============================================
 * 
 * Rule: Use sizes.* constants for heights, widths, icon sizes.
 */

// GOOD - Using size constants
const SizeExample = () => (
  <div className="space-y-4">
    {/* Button sizes */}
    <div className="space-y-2">
      <Button variant="primary" size="sm">Small Button</Button>
      <Button variant="primary" size="md">Medium Button</Button>
      <Button variant="primary" size="lg">Large Button</Button>
    </div>

    {/* Input sizes */}
    <div className="space-y-2">
      <Input type="text" size="sm" placeholder="Small input" />
      <Input type="text" size="md" placeholder="Medium input" />
      <Input type="text" size="lg" placeholder="Large input" />
    </div>

    {/* Icon sizes with classes */}
    <div className="flex gap-2 items-center">
      <div className="w-4 h-4">Icon sm</div>
      <div className="w-6 h-6">Icon md</div>
      <div className="w-8 h-8">Icon lg</div>
    </div>
  </div>
);

/**
 * ============================================
 * COMPLETE COMPONENT EXAMPLE
 * ============================================
 * 
 * Shows a real component using all design tokens correctly.
 */

interface UserFormProps {
  onSubmit?: (data: any) => void;
}

const UserFormExample: React.FC<UserFormProps> = ({ onSubmit }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
    {/* Page header with semantic spacing */}
    <div className="mb-8">
      <h1 className="text-2xl font-black mb-2">Create User</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Add a new user to the system
      </p>
    </div>

    {/* Form card with consistent elevation */}
    <Card variant="elevated" size="lg" className="max-w-md">
      {/* Header with spacing */}
      <Card.Header>
        <h2 className="text-xl font-bold">User Details</h2>
      </Card.Header>

      {/* Body with semantic spacing */}
      <Card.Body>
        <div className="space-y-4">
          {/* Semantic spacing between inputs */}
          <Input
            label="Full Name"
            placeholder="John Doe"
            required
            size="md"
          />

          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            required
            size="md"
          />

          <Input
            label="Phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            size="md"
          />
        </div>
      </Card.Body>

      {/* Footer with consistent button sizes */}
      <Card.Footer justify="end">
        <Button variant="secondary" size="md">
          Cancel
        </Button>
        <Button variant="primary" size="md">
          Create User
        </Button>
      </Card.Footer>
    </Card>
  </div>
);

/**
 * ============================================
 * DO's AND DON'Ts
 * ============================================
 */

/**
 * SPACING
 * 
 * ✅ DO:
 * - p-4, p-6, p-8 (16px, 24px, 32px)
 * - gap-4, gap-6, space-y-6 (16px, 24px gaps)
 * - m-4, my-2, mx-6 (standard increments)
 * 
 * ❌ DON'T:
 * - p-3, p-5, p-7 (non-standard values)
 * - gap-3, space-y-5 (odd increments)
 * - style={{ padding: '12px' }} (hardcoded)
 */

/**
 * BORDER RADIUS
 * 
 * ✅ DO:
 * - rounded-lg (8px - most common)
 * - rounded-2xl (4px - small elements)
 * - rounded-3xl (16px - rare)
 * 
 * ❌ DON'T:
 * - rounded-sm, rounded-md, rounded-xl (avoid middle values)
 * - style={{ borderRadius: '6px' }} (hardcoded)
 * - No radius - always use at least rounded-2xl
 */

/**
 * SHADOWS
 * 
 * ✅ DO:
 * - shadow-sm for cards
 * - shadow-md for hover/interactive
 * - shadow-lg for modals
 * - shadow-xl for dropdowns
 * 
 * ❌ DON'T:
 * - shadow-xs (use shadow-sm)
 * - Mixing multiple shadows
 * - shadow-inner (rarely appropriate)
 */

/**
 * TYPOGRAPHY
 * 
 * ✅ DO:
 * - h1-h4 for semantic heading levels
 * - text-sm for body (14px)
 * - text-xs for labels (12px)
 * - font-bold, font-semibold, font-regular
 * 
 * ❌ DON'T:
 * - text-base, text-lg, text-xl (use semantic heading sizes)
 * - Arbitrary font sizes like 13px, 15px
 * - Multiple heading levels in one component
 */

/**
 * Z-INDEX
 * 
 * ✅ DO:
 * - z-auto (default)
 * - z-1000 for dropdowns
 * - z-1050 for modals
 * - z-9999 for notifications
 * 
 * ❌ DON'T:
 * - z-50, z-500, z-2000 (use defined levels only)
 * - Arbitrary z-index values
 * - Competing z-index layers
 */

export const DesignSystemGuide: React.FC = () => (
  <div className="space-y-12 p-8">
    <SpacingExample />
    <RadiusExample />
    <TypographyExample />
    <ShadowExample />
    <ColorExample />
    <SizeExample />
    <UserFormExample />
  </div>
);

export default DesignSystemGuide;
