/**
 * Button Component Usage Examples
 * 
 * This file demonstrates all available Button variants, sizes, and states.
 * Import Button from '@/components/shared'
 */

import React, { useState } from 'react';
import { Button } from '@/components/shared';
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  ChevronRight, 
  Download,
  Save 
} from 'lucide-react';

export const ButtonExamples: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingDemo = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="space-y-12 p-8 bg-slate-50 dark:bg-slate-900">
      {/* ============================================ */}
      {/* VARIANTS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Button Variants</h2>
        
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          {/* Primary (default) */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Primary</p>
            <Button variant="primary">Save Changes</Button>
          </div>

          {/* Secondary */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Secondary</p>
            <Button variant="secondary">Cancel</Button>
          </div>

          {/* Tertiary */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Tertiary</p>
            <Button variant="tertiary">Learn More</Button>
          </div>

          {/* Outline */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Outline</p>
            <Button variant="outline">View Details</Button>
          </div>

          {/* Success */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Success</p>
            <Button variant="success">Confirm</Button>
          </div>

          {/* Warning */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Warning</p>
            <Button variant="warning">Attention Required</Button>
          </div>

          {/* Danger */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Danger</p>
            <Button variant="danger">Delete Account</Button>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SIZES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Button Sizes</h2>
        
        <div className="flex items-end gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Small</p>
            <Button variant="primary" size="sm">Small Button</Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Medium (default)</p>
            <Button variant="primary" size="md">Medium Button</Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Large</p>
            <Button variant="primary" size="lg">Large Button</Button>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* WITH ICONS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">With Icons</h2>
        
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          {/* Left Icon */}
          <Button variant="primary" icon={<Plus size={16} />}>
            Add Customer
          </Button>

          {/* Right Icon */}
          <Button variant="primary" iconRight={<ChevronRight size={16} />}>
            Next Step
          </Button>

          {/* Left Icon Secondary */}
          <Button variant="secondary" icon={<RefreshCw size={16} />}>
            Refresh Data
          </Button>

          {/* Danger with Icon */}
          <Button variant="danger" icon={<Trash2 size={16} />}>
            Delete Item
          </Button>

          {/* Large with Icon */}
          <Button 
            variant="primary" 
            size="lg" 
            icon={<Download size={18} />}
            className="col-span-2"
          >
            Download Report
          </Button>
        </div>
      </section>

      {/* ============================================ */}
      {/* LOADING STATE */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Loading State</h2>
        
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <Button 
            variant="primary" 
            loading={isLoading}
            onClick={handleLoadingDemo}
          >
            {isLoading ? 'Processing...' : 'Click to Load'}
          </Button>

          <Button 
            variant="primary" 
            loading={true}
            icon={<Save size={16} />}
          >
            Saving...
          </Button>
        </div>

        {isLoading && (
          <p className="text-sm text-slate-500 mt-4">
            Click the first button to see loading state in action
          </p>
        )}
      </section>

      {/* ============================================ */}
      {/* DISABLED STATE */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Disabled State</h2>
        
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <Button variant="primary" disabled>
            Disabled Primary
          </Button>

          <Button variant="secondary" disabled>
            Disabled Secondary
          </Button>

          <Button variant="danger" disabled icon={<Trash2 size={16} />}>
            Disabled Danger
          </Button>
        </div>
      </section>

      {/* ============================================ */}
      {/* FULL WIDTH */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Full Width</h2>
        
        <div className="max-w-md space-y-3">
          <Button variant="primary" fullWidth>
            Full Width Primary
          </Button>

          <Button variant="secondary" fullWidth>
            Full Width Secondary
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="tertiary" fullWidth>
              Cancel
            </Button>
            <Button variant="primary" fullWidth>
              Confirm
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* COMMON PATTERNS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Common Patterns</h2>
        
        {/* Form Actions */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Form Actions</h3>
          <div className="flex gap-2">
            <Button variant="primary" icon={<Save size={16} />}>
              Save Changes
            </Button>
            <Button variant="secondary">
              Cancel
            </Button>
          </div>
        </div>

        {/* Delete Confirmation */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Delete Confirmation</h3>
          <div className="flex gap-2">
            <Button variant="danger" icon={<Trash2 size={16} />}>
              Delete
            </Button>
            <Button variant="secondary">
              Keep
            </Button>
          </div>
        </div>

        {/* Primary Action with Secondary */}
        <div>
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Primary with Secondary</h3>
          <div className="flex gap-2">
            <Button variant="primary" icon={<Plus size={16} />}>
              Create New
            </Button>
            <Button variant="tertiary">
              View Guidelines
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ButtonExamples;

/**
 * USAGE GUIDE
 * 
 * 1. Basic Button
 *    <Button>Click Me</Button>
 * 
 * 2. With Variant
 *    <Button variant="danger">Delete</Button>
 * 
 * 3. With Size
 *    <Button size="lg">Large Button</Button>
 * 
 * 4. With Icon
 *    <Button icon={<Plus size={16} />}>Add</Button>
 *    <Button iconRight={<ChevronRight size={16} />}>Next</Button>
 * 
 * 5. Loading State
 *    <Button loading={isLoading}>Processing...</Button>
 * 
 * 6. Disabled
 *    <Button disabled>Not Available</Button>
 * 
 * 7. Full Width
 *    <Button fullWidth>Full Width Button</Button>
 * 
 * 8. Custom Class
 *    <Button className="custom-class">Button</Button>
 * 
 * 9. With onClick Handler
 *    <Button onClick={() => handleClick()}>Action</Button>
 * 
 * 10. Combining Multiple Props
 *     <Button 
 *       variant="success" 
 *       size="lg" 
 *       icon={<Save size={18} />}
 *       loading={isSaving}
 *       fullWidth
 *     >
 *       Save Changes
 *     </Button>
 */
