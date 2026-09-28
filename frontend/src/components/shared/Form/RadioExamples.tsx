/**
 * Radio Component Usage Examples
 * 
 * This file demonstrates all available Radio and RadioGroup variants.
 * Import Radio, RadioGroup from '@/components/shared'
 */

import React, { useState } from 'react';
import { Radio, RadioGroup, Button, Card } from '@/components/shared';

export const RadioExamples: React.FC = () => {
  // State management
  const [contactMethod, setContactMethod] = useState('email');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [frequency, setFrequency] = useState('weekly');
  const [priority, setPriority] = useState('medium');
  const [theme, setTheme] = useState('light');

  // Sample data
  const contactOptions = [
    { value: 'email', label: 'Email', description: 'Fastest response (24 hours)' },
    { value: 'phone', label: 'Phone', description: 'Immediate assistance' },
    { value: 'chat', label: 'Live Chat', description: 'Real-time support' },
    { value: 'support', label: 'Support Ticket', description: 'Tracked request' },
  ];

  const shippingOptions = [
    { value: 'standard', label: 'Standard', description: '5-7 business days - Free' },
    { value: 'express', label: 'Express', description: '2-3 business days - $10' },
    { value: 'overnight', label: 'Overnight', description: 'Next day delivery - $25' },
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'Daily', description: 'Every day at 9 AM' },
    { value: 'weekly', label: 'Weekly', description: 'Every Monday morning' },
    { value: 'monthly', label: 'Monthly', description: 'First day of month' },
    { value: 'never', label: 'Never', description: 'No updates' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', description: 'Can wait' },
    { value: 'medium', label: 'Medium', description: 'Normal priority' },
    { value: 'high', label: 'High', description: 'Important' },
    { value: 'urgent', label: 'Urgent', description: 'Needs immediate action' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light', description: 'Bright, clean interface' },
    { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
    { value: 'auto', label: 'Auto', description: 'Based on system preference' },
  ];

  return (
    <div className="space-y-12 p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* ============================================ */}
      {/* SIZES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Radio Sizes</h2>

        <div className="space-y-4">
          <Radio size="sm" label="Small radio button" />
          <Radio size="md" label="Medium radio button (default)" />
          <Radio size="lg" label="Large radio button" />
        </div>
      </section>

      {/* ============================================ */}
      {/* STATUS STATES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Status States
        </h2>

        <div className="space-y-6">
          <Radio
            size="md"
            label="Default"
            description="Standard radio state"
            helperText="No validation status"
            defaultChecked
          />

          <Radio
            size="md"
            label="Success"
            description="Selection is valid"
            success
            helperText="Selection approved"
            defaultChecked
          />

          <Radio
            size="md"
            label="Error"
            description="Invalid selection"
            error
            errorMessage="This option is not available for your region"
            helperText="Choose a different option"
          />

          <Radio
            size="md"
            label="Warning"
            description="Requires attention"
            warning
            warningMessage="This option will change your settings"
            helperText="Review before confirming"
            defaultChecked
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* SINGLE RADIO */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Single Radio Usage
        </h2>

        <Card variant="default" className="max-w-md">
          <Card.Header>Contact Preference (Individual)</Card.Header>

          <Card.Body>
            <div className="space-y-4">
              {contactOptions.slice(0, 2).map((option) => (
                <Radio
                  key={option.value}
                  name="contact"
                  value={option.value}
                  label={option.label}
                  description={option.description}
                  defaultChecked={option.value === 'email'}
                  size="md"
                />
              ))}
            </div>
          </Card.Body>
        </Card>
      </section>

      {/* ============================================ */}
      {/* RADIO GROUP - VERTICAL */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          RadioGroup - Vertical Layout
        </h2>

        <Card variant="default" className="max-w-xl">
          <Card.Header>How would you like us to contact you?</Card.Header>

          <Card.Body>
            <RadioGroup
              label="Preferred Contact Method"
              name="contact-method"
              items={contactOptions}
              value={contactMethod}
              onChange={setContactMethod}
              size="md"
              required
              layout="vertical"
              helperText="Choose your preferred way to be contacted"
            />
          </Card.Body>

          {contactMethod && (
            <div className="bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-lg p-3 mx-4 mb-4">
              <p className="text-sm text-primary dark:text-primary font-medium">
                Selected: {contactOptions.find((o) => o.value === contactMethod)?.label}
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* ============================================ */}
      {/* RADIO GROUP - HORIZONTAL */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          RadioGroup - Horizontal Layout
        </h2>

        <Card variant="default" className="max-w-2xl">
          <Card.Header>Theme Preference</Card.Header>

          <Card.Body>
            <RadioGroup
              label="Choose your theme"
              name="theme"
              items={themeOptions}
              value={theme}
              onChange={setTheme}
              size="md"
              layout="horizontal"
              helperText="Changes take effect immediately"
            />
          </Card.Body>
        </Card>
      </section>

      {/* ============================================ */}
      {/* WITH DESCRIPTIONS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          With Descriptions
        </h2>

        <RadioGroup
          label="Shipping Method"
          name="shipping"
          items={shippingOptions}
          value={shippingMethod}
          onChange={setShippingMethod}
          size="md"
          layout="vertical"
          helperText="Select the delivery speed you prefer"
        />

        {shippingMethod && (
          <div className="mt-4 p-3 bg-success/10 dark:bg-success/20 border border-success/30 rounded-lg">
            <p className="text-sm text-success dark:text-success font-medium">
              Shipping option: {shippingOptions.find((o) => o.value === shippingMethod)?.label}
            </p>
          </div>
        )}
      </section>

      {/* ============================================ */}
      {/* DISABLED STATE */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Disabled State
        </h2>

        <div className="space-y-6">
          <Radio
            size="md"
            label="Disabled (Unchecked)"
            description="This option is not available"
            disabled
          />

          <Radio
            size="md"
            label="Disabled (Checked)"
            description="This option is locked"
            disabled
            defaultChecked
          />

          <RadioGroup
            label="Disabled Group"
            name="disabled-group"
            items={priorityOptions}
            disabled
            value="medium"
            helperText="All options are disabled"
            layout="vertical"
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* FORM PATTERN - CHECKOUT */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Form Pattern - Checkout
        </h2>

        <Card variant="elevated" size="lg" className="max-w-2xl">
          <Card.Header>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Order Summary
            </h3>
          </Card.Header>

          <Card.Body>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Shipping Speed
                </h4>

                <RadioGroup
                  name="shipping-speed"
                  items={shippingOptions}
                  value={shippingMethod}
                  onChange={setShippingMethod}
                  layout="vertical"
                  size="md"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Contact Method
                </h4>

                <RadioGroup
                  name="contact"
                  items={contactOptions.slice(0, 2)}
                  value={contactMethod}
                  onChange={setContactMethod}
                  layout="vertical"
                  size="md"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <span className="font-bold">Total:</span>
                  <span className="text-xl font-black">$99.99</span>
                </div>
              </div>
            </div>
          </Card.Body>

          <Card.Footer justify="end">
            <Button variant="secondary">Continue Shopping</Button>
            <Button variant="primary">Proceed to Payment</Button>
          </Card.Footer>
        </Card>
      </section>

      {/* ============================================ */}
      {/* VALIDATION STATES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Validation States
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="Priority Level (Success)"
            name="priority-success"
            items={priorityOptions}
            value="high"
            status="success"
            size="md"
            layout="vertical"
          />

          <RadioGroup
            label="Frequency (Error - Not Selected)"
            name="frequency-error"
            items={frequencyOptions}
            status="error"
            errorMessage="Please select an update frequency"
            size="md"
            layout="vertical"
          />

          <RadioGroup
            label="Theme (Warning)"
            name="theme-warning"
            items={themeOptions}
            value="light"
            status="warning"
            warningMessage="Changing theme will affect all users"
            size="md"
            layout="vertical"
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* SETTINGS PANEL */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Settings Panel Pattern
        </h2>

        <Card variant="default" className="max-w-2xl">
          <Card.Header>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Notification Settings
            </h3>
          </Card.Header>

          <Card.Body>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Email Frequency
                </h4>

                <RadioGroup
                  name="email-frequency"
                  items={frequencyOptions}
                  value={frequency}
                  onChange={setFrequency}
                  layout="vertical"
                  size="md"
                  helperText="How often should we send you updates?"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Display Theme
                </h4>

                <RadioGroup
                  name="theme-setting"
                  items={themeOptions}
                  value={theme}
                  onChange={setTheme}
                  layout="horizontal"
                  size="md"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Priority Level
                </h4>

                <RadioGroup
                  name="priority-setting"
                  items={priorityOptions}
                  value={priority}
                  onChange={setPriority}
                  layout="horizontal"
                  size="md"
                />
              </div>
            </div>
          </Card.Body>

          <Card.Footer justify="end">
            <Button variant="secondary">Reset to Defaults</Button>
            <Button variant="primary">Save Settings</Button>
          </Card.Footer>
        </Card>
      </section>

      {/* ============================================ */}
      {/* SURVEY PATTERN */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Survey Pattern
        </h2>

        <Card variant="default" className="max-w-2xl">
          <Card.Header>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Quick Feedback Survey
            </h3>
          </Card.Header>

          <Card.Body>
            <div className="space-y-6">
              <RadioGroup
                label="How satisfied are you with our service?"
                name="satisfaction"
                items={[
                  { value: 'very-satisfied', label: 'Very Satisfied' },
                  { value: 'satisfied', label: 'Satisfied' },
                  { value: 'neutral', label: 'Neutral' },
                  { value: 'dissatisfied', label: 'Dissatisfied' },
                ]}
                size="md"
                layout="vertical"
                required
              />

              <RadioGroup
                label="How likely are you to recommend us?"
                name="recommend"
                items={[
                  { value: 'very-likely', label: 'Very Likely' },
                  { value: 'likely', label: 'Likely' },
                  { value: 'unlikely', label: 'Unlikely' },
                  { value: 'very-unlikely', label: 'Very Unlikely' },
                ]}
                size="md"
                layout="vertical"
                required
              />
            </div>
          </Card.Body>

          <Card.Footer justify="end">
            <Button variant="secondary">Not Now</Button>
            <Button variant="primary">Submit Feedback</Button>
          </Card.Footer>
        </Card>
      </section>

      {/* ============================================ */}
      {/* KEYBOARD NAVIGATION */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Keyboard Navigation
        </h2>

        <Card variant="flat" size="lg" className="max-w-2xl">
          <Card.Header>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Try these keyboard shortcuts:
            </h3>
          </Card.Header>

          <Card.Body>
            <ul className="space-y-2 text-sm mb-6">
              <li>
                <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs font-mono">
                  Tab
                </kbd>
                {' '}Navigate to next radio button
              </li>
              <li>
                <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs font-mono">
                  Shift+Tab
                </kbd>
                {' '}Navigate to previous radio button
              </li>
              <li>
                <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs font-mono">
                  Arrow Keys
                </kbd>
                {' '}Navigate within radio group
              </li>
              <li>
                <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs font-mono">
                  Space
                </kbd>
                {' '}Select focused radio button
              </li>
            </ul>

            <RadioGroup
              label="Try keyboard navigation"
              name="keyboard-demo"
              items={themeOptions}
              value={theme}
              onChange={setTheme}
              layout="vertical"
              size="md"
              helperText="Use arrow keys to navigate between options"
            />
          </Card.Body>
        </Card>
      </section>
    </div>
  );
};

export default RadioExamples;

/**
 * USAGE GUIDE
 *
 * 1. Basic Radio
 *    <Radio name="option" value="1" label="Option 1" />
 *
 * 2. With Description
 *    <Radio
 *      name="option"
 *      value="1"
 *      label="Option 1"
 *      description="This is option 1"
 *    />
 *
 * 3. With Status
 *    <Radio
 *      name="option"
 *      value="1"
 *      label="Option 1"
 *      success
 *      helperText="Valid selection"
 *    />
 *
 * 4. RadioGroup Vertical
 *    <RadioGroup
 *      label="Choose one"
 *      name="option"
 *      items={options}
 *      value={selected}
 *      onChange={setSelected}
 *      layout="vertical"
 *    />
 *
 * 5. RadioGroup Horizontal
 *    <RadioGroup
 *      label="Choose one"
 *      name="option"
 *      items={options}
 *      value={selected}
 *      onChange={setSelected}
 *      layout="horizontal"
 *    />
 *
 * 6. Disabled Radio
 *    <Radio name="option" value="1" label="Disabled" disabled />
 *
 * 7. Disabled Group
 *    <RadioGroup items={options} disabled />
 *
 * 8. With Validation
 *    <RadioGroup
 *      items={options}
 *      error
 *      errorMessage="Please select an option"
 *      status="error"
 *    />
 */
