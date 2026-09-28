/**
 * Checkbox Component Usage Examples
 * 
 * This file demonstrates all available Checkbox and CheckboxGroup variants.
 * Import Checkbox, CheckboxGroup from '@/components/shared'
 */

import React, { useState } from 'react';
import { Checkbox, CheckboxGroup, Button, Card } from '@/components/shared';

export const CheckboxExamples: React.FC = () => {
  // State management
  const [singleChecked, setSingleChecked] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<string[]>(['dark-mode', 'notifications']);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['react', 'typescript']);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [permissions, setPermissions] = useState<string[]>(['read']);

  // Sample data
  const skillsOptions = [
    { value: 'react', label: 'React', description: 'JavaScript library for UI' },
    { value: 'typescript', label: 'TypeScript', description: 'Typed JavaScript' },
    { value: 'node', label: 'Node.js', description: 'Server-side JavaScript' },
    { value: 'python', label: 'Python', description: 'General purpose language' },
    { value: 'sql', label: 'SQL', description: 'Database queries' },
  ];

  const featureOptions = [
    { value: 'dark-mode', label: 'Dark Mode', description: 'Enable dark theme' },
    { value: 'notifications', label: 'Notifications', description: 'Push notifications' },
    { value: 'analytics', label: 'Analytics', description: 'Track user analytics' },
    { value: 'email-updates', label: 'Email Updates', description: 'Weekly digest emails' },
  ];

  const permissionOptions = [
    { value: 'read', label: 'Read', description: 'View content' },
    { value: 'write', label: 'Write', description: 'Create and edit' },
    { value: 'delete', label: 'Delete', description: 'Remove items' },
    { value: 'admin', label: 'Admin', description: 'Full access' },
  ];

  return (
    <div className="space-y-12 p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* ============================================ */}
      {/* SIZES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Checkbox Sizes</h2>

        <div className="space-y-4">
          <Checkbox size="sm" label="Small checkbox" />
          <Checkbox size="md" label="Medium checkbox (default)" />
          <Checkbox size="lg" label="Large checkbox" />
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
          <Checkbox
            size="md"
            label="Default"
            description="Standard checkbox state"
            helperText="No validation status"
            defaultChecked
          />

          <Checkbox
            size="md"
            label="Success"
            description="Input is valid"
            success
            helperText="All requirements met"
            defaultChecked
          />

          <Checkbox
            size="md"
            label="Error"
            description="Something went wrong"
            error
            errorMessage="This option conflicts with another selection"
            helperText="Review your choices"
          />

          <Checkbox
            size="md"
            label="Warning"
            description="Needs attention"
            warning
            warningMessage="This option will be deprecated soon"
            helperText="Consider using the newer option"
            defaultChecked
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* INDETERMINATE STATE */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Indeterminate State
        </h2>

        <Card variant="default" className="max-w-md">
          <Card.Header>Select All Pattern</Card.Header>

          <Card.Body>
            <div className="space-y-3">
              <Checkbox
                size="md"
                label="Select All"
                indeterminate={selectedSkills.length > 0 && selectedSkills.length < skillsOptions.length}
                checked={selectedSkills.length === skillsOptions.length}
                onChange={(e) => {
                  if (e.currentTarget.checked) {
                    setSelectedSkills(skillsOptions.map((s) => s.value));
                  } else {
                    setSelectedSkills([]);
                  }
                }}
              />

              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2 pl-6">
                {skillsOptions.map((skill) => (
                  <Checkbox
                    key={skill.value}
                    size="sm"
                    label={skill.label}
                    checked={selectedSkills.includes(skill.value)}
                    onChange={(e) => {
                      if (e.currentTarget.checked) {
                        setSelectedSkills([...selectedSkills, skill.value]);
                      } else {
                        setSelectedSkills(selectedSkills.filter((s) => s !== skill.value));
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>
      </section>

      {/* ============================================ */}
      {/* CHECKBOX GROUP - VERTICAL */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Checkbox Group - Vertical
        </h2>

        <CheckboxGroup
          label="Select Your Skills"
          items={skillsOptions}
          value={selectedSkills}
          onChange={setSelectedSkills}
          size="md"
          selectAllOption
          selectAllLabel="Select all skills"
          helperText="Choose the skills you have experience with"
          layout="vertical"
        />

        {selectedSkills.length > 0 && (
          <div className="mt-4 p-3 bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-lg">
            <p className="text-sm text-primary dark:text-primary font-medium">
              Selected: {selectedSkills.join(', ')}
            </p>
          </div>
        )}
      </section>

      {/* ============================================ */}
      {/* CHECKBOX GROUP - HORIZONTAL */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Checkbox Group - Horizontal
        </h2>

        <CheckboxGroup
          label="Feature Preferences"
          items={featureOptions}
          value={featureFlags}
          onChange={setFeatureFlags}
          size="md"
          selectAllOption
          layout="horizontal"
          helperText="Enable or disable features as needed"
        />
      </section>

      {/* ============================================ */}
      {/* WITH DESCRIPTIONS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          With Descriptions
        </h2>

        <div className="space-y-4">
          {skillsOptions.map((skill) => (
            <Checkbox
              key={skill.value}
              size="md"
              label={skill.label}
              description={skill.description}
              defaultChecked={selectedSkills.includes(skill.value)}
            />
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* DISABLED STATE */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Disabled State
        </h2>

        <div className="space-y-4">
          <Checkbox
            size="md"
            label="Disabled (Unchecked)"
            disabled
            description="This option is not available"
          />

          <Checkbox
            size="md"
            label="Disabled (Checked)"
            disabled
            defaultChecked
            description="This option is locked"
          />

          <CheckboxGroup
            label="Disabled Group"
            items={permissionOptions}
            disabled
            value={['read']}
            helperText="All options are disabled"
            layout="vertical"
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* FORM PATTERN - TERMS & CONDITIONS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Form Pattern - Account Setup
        </h2>

        <Card variant="elevated" size="lg" className="max-w-2xl">
          <Card.Header>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Account Preferences
            </h3>
          </Card.Header>

          <Card.Body>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Notification Settings
                </h4>

                <CheckboxGroup
                  items={featureOptions}
                  value={featureFlags}
                  onChange={setFeatureFlags}
                  layout="vertical"
                  size="md"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Access Permissions
                </h4>

                <CheckboxGroup
                  items={permissionOptions}
                  value={permissions}
                  onChange={setPermissions}
                  layout="vertical"
                  size="md"
                  selectAllOption
                  selectAllLabel="Grant all permissions"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <Checkbox
                  size="md"
                  label="I agree to the Terms of Service"
                  description="Please review our terms before proceeding"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.currentTarget.checked)}
                  required
                  error={false}
                  errorMessage={!termsAccepted ? 'You must accept the terms' : ''}
                />
              </div>
            </div>
          </Card.Body>

          <Card.Footer justify="end">
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary" disabled={!termsAccepted}>
              Save Preferences
            </Button>
          </Card.Footer>
        </Card>
      </section>

      {/* ============================================ */}
      {/* PERMISSION MATRIX */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Permission Matrix
        </h2>

        <Card variant="default" className="max-w-2xl">
          <Card.Header>Role-Based Permissions</Card.Header>

          <Card.Body>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-3 font-bold text-slate-900 dark:text-white">
                      Feature
                    </th>
                    <th className="text-center py-2 px-3 font-bold text-slate-900 dark:text-white">
                      Read
                    </th>
                    <th className="text-center py-2 px-3 font-bold text-slate-900 dark:text-white">
                      Write
                    </th>
                    <th className="text-center py-2 px-3 font-bold text-slate-900 dark:text-white">
                      Delete
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {['Users', 'Reports', 'Settings', 'Billing'].map((feature) => (
                    <tr key={feature} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="py-3 px-3 font-medium">{feature}</td>
                      <td className="text-center py-3 px-3">
                        <Checkbox size="sm" defaultChecked />
                      </td>
                      <td className="text-center py-3 px-3">
                        <Checkbox size="sm" />
                      </td>
                      <td className="text-center py-3 px-3">
                        <Checkbox size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      </section>

      {/* ============================================ */}
      {/* VALIDATION STATES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Validation States in Group
        </h2>

        <div className="space-y-6">
          <CheckboxGroup
            label="Required Skills (Success)"
            items={skillsOptions}
            value={selectedSkills}
            onChange={setSelectedSkills}
            status="success"
            size="md"
            layout="vertical"
          />

          <CheckboxGroup
            label="At least one option required (Error)"
            items={featureOptions}
            value={[]}
            error
            errorMessage="Please select at least one option"
            status="error"
            size="md"
            layout="vertical"
          />

          <CheckboxGroup
            label="Consider all options (Warning)"
            items={permissionOptions}
            value={permissions}
            onChange={setPermissions}
            warning
            warningMessage="Some permissions may have security implications"
            status="warning"
            size="md"
            layout="vertical"
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* COMMON PATTERNS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Common Patterns
        </h2>

        <div className="space-y-6">
          {/* Agree to terms */}
          <Card variant="default">
            <Card.Header>Agree to Terms</Card.Header>
            <Card.Body>
              <div className="space-y-2">
                <Checkbox
                  size="md"
                  label="I agree to the Terms of Service"
                  required
                />

                <Checkbox
                  size="md"
                  label="I agree to the Privacy Policy"
                  required
                />

                <Checkbox
                  size="md"
                  label="I want to receive marketing emails"
                  description="Optional: Get updates about new features"
                />
              </div>
            </Card.Body>
          </Card>

          {/* Filter options */}
          <Card variant="default">
            <Card.Header>Filter Search Results</Card.Header>
            <Card.Body>
              <CheckboxGroup
                label="Categories"
                items={[
                  { value: 'product', label: 'Products' },
                  { value: 'blog', label: 'Blog Articles' },
                  { value: 'support', label: 'Support Docs' },
                  { value: 'tutorial', label: 'Tutorials' },
                ]}
                layout="vertical"
                size="md"
              />
            </Card.Body>
          </Card>

          {/* Notification preferences */}
          <Card variant="default">
            <Card.Header>Email Preferences</Card.Header>
            <Card.Body>
              <CheckboxGroup
                items={[
                  { value: 'daily', label: 'Daily Digest', description: 'Once a day at 9 AM' },
                  { value: 'weekly', label: 'Weekly Summary', description: 'Every Monday' },
                  { value: 'alerts', label: 'Urgent Alerts', description: 'Immediately' },
                ]}
                layout="vertical"
                size="md"
              />
            </Card.Body>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default CheckboxExamples;

/**
 * USAGE GUIDE
 *
 * 1. Basic Checkbox
 *    <Checkbox label="Accept terms" />
 *
 * 2. With Description
 *    <Checkbox
 *      label="Dark Mode"
 *      description="Use dark theme"
 *    />
 *
 * 3. With Status
 *    <Checkbox
 *      label="Email"
 *      success
 *      helperText="Valid email"
 *    />
 *
 * 4. Indeterminate (Select All)
 *    <Checkbox
 *      label="Select All"
 *      indeterminate={someSelected}
 *      checked={allSelected}
 *    />
 *
 * 5. Checkbox Group
 *    <CheckboxGroup
 *      label="Skills"
 *      items={skillsOptions}
 *      value={selected}
 *      onChange={setSelected}
 *      selectAllOption
 *    />
 *
 * 6. Horizontal Layout
 *    <CheckboxGroup
 *      items={options}
 *      layout="horizontal"
 *    />
 *
 * 7. Disabled State
 *    <Checkbox label="Locked" disabled />
 *
 * 8. Disabled Group
 *    <CheckboxGroup items={options} disabled />
 */
