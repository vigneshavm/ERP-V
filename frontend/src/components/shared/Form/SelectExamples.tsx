/**
 * Select Component Usage Examples
 * 
 * This file demonstrates all available Select variants, features, and patterns.
 * Import Select from '@/components/shared'
 */

import React, { useState } from 'react';
import { Select, Button, Card } from '@/components/shared';
import { Users, MapPin, Briefcase, Zap } from 'lucide-react';
import type { SelectOption } from './Select';

export const SelectExamples: React.FC = () => {
  // State management for examples
  const [singleValue, setSingleValue] = useState('');
  const [multiValue, setMultiValue] = useState<string[]>([]);
  const [countryValue, setCountryValue] = useState('');
  const [departmentValue, setDepartmentValue] = useState('');

  // Sample options
  const countryOptions: SelectOption[] = [
    { value: 'us', label: 'United States', description: 'USA' },
    { value: 'uk', label: 'United Kingdom', description: 'UK' },
    { value: 'ca', label: 'Canada', description: 'North America' },
    { value: 'au', label: 'Australia', description: 'Oceania' },
    { value: 'in', label: 'India', description: 'South Asia' },
  ];

  const skillOptions: SelectOption[] = [
    { value: 'react', label: 'React', description: 'JavaScript library' },
    { value: 'typescript', label: 'TypeScript', description: 'Typed JavaScript' },
    { value: 'node', label: 'Node.js', description: 'Server-side JS' },
    { value: 'python', label: 'Python', description: 'General purpose' },
    { value: 'sql', label: 'SQL', description: 'Database' },
    { value: 'aws', label: 'AWS', description: 'Cloud services' },
    { value: 'docker', label: 'Docker', description: 'Containerization' },
  ];

  const departmentOptions: SelectOption[] = [
    { value: 'sales', label: 'Sales', description: 'Sales & Business Development' },
    { value: 'marketing', label: 'Marketing', description: 'Marketing & Communications' },
    {
      value: 'engineering',
      label: 'Engineering',
      description: 'Software & Infrastructure',
    },
    { value: 'hr', label: 'Human Resources', description: 'HR & Recruitment' },
    { value: 'finance', label: 'Finance', description: 'Finance & Accounting' },
    {
      value: 'operations',
      label: 'Operations',
      description: 'Operations & Support',
    },
  ];

  const priorityOptions: SelectOption[] = [
    { value: 'low', label: 'Low', description: 'Can wait' },
    { value: 'medium', label: 'Medium', description: 'Normal priority' },
    { value: 'high', label: 'High', description: 'Important' },
    { value: 'critical', label: 'Critical', description: 'Urgent', disabled: true },
  ];

  return (
    <div className="space-y-12 p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* ============================================ */}
      {/* SIZES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Select Sizes</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="default">
            <Card.Header>Small</Card.Header>
            <Card.Body>
              <Select
                size="sm"
                options={countryOptions}
                placeholder="Select country"
                value={singleValue}
                onChange={(val) => setSingleValue(typeof val === 'string' ? val : val[0])}
              />
            </Card.Body>
          </Card>

          <Card variant="default">
            <Card.Header>Medium</Card.Header>
            <Card.Body>
              <Select
                size="md"
                options={countryOptions}
                placeholder="Select country"
                value={countryValue}
                onChange={(val) => setCountryValue(typeof val === 'string' ? val : val[0])}
              />
            </Card.Body>
          </Card>

          <Card variant="default">
            <Card.Header>Large</Card.Header>
            <Card.Body>
              <Select
                size="lg"
                options={countryOptions}
                placeholder="Select country"
              />
            </Card.Body>
          </Card>
        </div>
      </section>

      {/* ============================================ */}
      {/* SINGLE SELECT */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Single Select</h2>

        <div className="max-w-md">
          <Select
            size="md"
            label="Country"
            placeholder="Choose your country"
            options={countryOptions}
            value={countryValue}
            onChange={(val) => setCountryValue(typeof val === 'string' ? val : val[0])}
            searchable
            required
            helperText="Your location will help us serve you better"
          />

          {countryValue && (
            <div className="mt-4 p-3 bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-lg">
              <p className="text-sm text-primary dark:text-primary font-medium">
                Selected: {countryOptions.find((o) => o.value === countryValue)?.label}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ============================================ */}
      {/* MULTI SELECT */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Multi-Select</h2>

        <div className="max-w-md">
          <Select
            size="md"
            label="Required Skills"
            placeholder="Select required skills"
            options={skillOptions}
            value={multiValue}
            onChange={(val) => setMultiValue(typeof val === 'string' ? [] : val)}
            multiple
            searchable
            helperText="Select all applicable skills"
            renderValue={(selected) => (
              <div className="flex gap-1 flex-wrap">
                {selected.length === 0 ? (
                  <span className="text-slate-500">No skills selected</span>
                ) : (
                  selected.map((skill) => (
                    <span
                      key={skill.value}
                      className="inline-block px-2 py-1 text-xs bg-primary/20 text-primary rounded"
                    >
                      {skill.label}
                    </span>
                  ))
                )}
              </div>
            )}
          />

          {multiValue.length > 0 && (
            <div className="mt-4 p-3 bg-success/10 dark:bg-success/20 border border-success/30 rounded-lg">
              <p className="text-sm text-success dark:text-success font-medium">
                {multiValue.length} skill(s) selected
              </p>
            </div>
          )}
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
          {/* Default */}
          <Select
            size="md"
            label="Default"
            placeholder="Select an option"
            options={departmentOptions}
            searchable
            helperText="Standard select state"
          />

          {/* Success */}
          <Select
            size="md"
            label="Success"
            placeholder="Select an option"
            options={departmentOptions}
            defaultValue="engineering"
            success
            helperText="Selection validated"
            searchable
          />

          {/* Error */}
          <Select
            size="md"
            label="Error"
            placeholder="Select an option"
            options={departmentOptions}
            error
            errorMessage="Department selection is required"
            helperText="This field is required"
            searchable
          />

          {/* Warning */}
          <Select
            size="md"
            label="Warning"
            placeholder="Select an option"
            options={departmentOptions}
            warning
            warningMessage="This choice affects team assignments"
            helperText="Choose carefully"
            searchable
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* SEARCHABLE */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Searchable</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="default">
            <Card.Header>With Search (Default)</Card.Header>
            <Card.Body>
              <Select
                size="md"
                label="Find by country name or description"
                options={countryOptions}
                searchable
                placeholder="Type to search..."
                searchPlaceholder="Search countries..."
              />
            </Card.Body>
          </Card>

          <Card variant="default">
            <Card.Header>Without Search</Card.Header>
            <Card.Body>
              <Select
                size="md"
                label="Browse options without search"
                options={countryOptions}
                searchable={false}
                placeholder="Choose from list..."
              />
            </Card.Body>
          </Card>
        </div>
      </section>

      {/* ============================================ */}
      {/* DISABLED OPTIONS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Disabled Options
        </h2>

        <Card variant="default" className="max-w-md">
          <Card.Header>Priority Selector</Card.Header>
          <Card.Body>
            <Select
              size="md"
              label="Priority Level"
              placeholder="Select priority"
              options={priorityOptions}
              searchable
              helperText="Critical priority is disabled"
            />
          </Card.Body>
        </Card>
      </section>

      {/* ============================================ */}
      {/* DISABLED SELECT */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Disabled Select
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="default">
            <Card.Header>Disabled (Empty)</Card.Header>
            <Card.Body>
              <Select
                size="md"
                label="Locked Selection"
                options={countryOptions}
                disabled
                placeholder="This is disabled"
              />
            </Card.Body>
          </Card>

          <Card variant="default">
            <Card.Header>Disabled (With Value)</Card.Header>
            <Card.Body>
              <Select
                size="md"
                label="Locked Selection"
                options={countryOptions}
                value="us"
                disabled
                success
              />
            </Card.Body>
          </Card>
        </div>
      </section>

      {/* ============================================ */}
      {/* FORM PATTERN */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Form Pattern Example
        </h2>

        <Card variant="elevated" size="lg" className="max-w-2xl">
          <Card.Header>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Employee Onboarding
            </h3>
          </Card.Header>

          <Card.Body>
            <div className="space-y-4">
              <Select
                size="md"
                label="Department"
                placeholder="Select department"
                options={departmentOptions}
                value={departmentValue}
                onChange={(val) => setDepartmentValue(typeof val === 'string' ? val : val[0])}
                searchable
                required
                helperText="Choose the department this employee will join"
              />

              <Select
                size="md"
                label="Country of Residence"
                placeholder="Select country"
                options={countryOptions}
                searchable
                required
                helperText="For compliance and benefits eligibility"
              />

              <Select
                size="md"
                label="Skills"
                placeholder="Select primary skills"
                options={skillOptions}
                multiple
                searchable
                helperText="Select at least 2 skills"
              />

              <Select
                size="md"
                label="Access Level"
                placeholder="Select access level"
                options={[
                  { value: 'basic', label: 'Basic', description: 'Read-only access' },
                  { value: 'standard', label: 'Standard', description: 'Edit and create' },
                  { value: 'admin', label: 'Admin', description: 'Full system access' },
                ]}
                searchable
                required
              />
            </div>
          </Card.Body>

          <Card.Footer justify="end">
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary">Continue</Button>
          </Card.Footer>
        </Card>
      </section>

      {/* ============================================ */}
      {/* CUSTOM RENDERING */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Custom Option Rendering
        </h2>

        <Card variant="default" className="max-w-md">
          <Card.Header>Department with Icons</Card.Header>
          <Card.Body>
            <Select
              size="md"
              label="Department"
              placeholder="Select department"
              options={departmentOptions}
              searchable
              renderOption={(option, isSelected) => (
                <div className="flex items-center gap-2">
                  {option.value === 'sales' && <Briefcase size={16} />}
                  {option.value === 'marketing' && <Zap size={16} />}
                  {option.value === 'engineering' && <Briefcase size={16} />}
                  {option.value === 'hr' && <Users size={16} />}
                  {option.value === 'finance' && <Briefcase size={16} />}
                  {option.value === 'operations' && <MapPin size={16} />}

                  <div>
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-slate-500">{option.description}</div>
                  </div>

                  {isSelected && (
                    <span className="ml-auto text-primary font-bold">✓</span>
                  )}
                </div>
              )}
            />
          </Card.Body>
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
                  ↓
                </kbd>
                {' '}Navigate down through options
              </li>
              <li>
                <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs font-mono">
                  ↑
                </kbd>
                {' '}Navigate up through options
              </li>
              <li>
                <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs font-mono">
                  Enter
                </kbd>
                {' '}Select highlighted option
              </li>
              <li>
                <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs font-mono">
                  Esc
                </kbd>
                {' '}Close menu
              </li>
              <li>
                <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs font-mono">
                  Space
                </kbd>
                {' '}Open/close menu
              </li>
            </ul>

            <Select
              size="md"
              label="Try keyboard navigation"
              placeholder="Click here and use arrow keys"
              options={countryOptions}
              searchable
              helperText="Open this dropdown and navigate with keyboard"
            />
          </Card.Body>
        </Card>
      </section>
    </div>
  );
};

export default SelectExamples;

/**
 * USAGE GUIDE
 *
 * 1. Basic Single Select
 *    <Select
 *      options={countryOptions}
 *      placeholder="Select..."
 *      onChange={(value) => setValue(value)}
 *    />
 *
 * 2. Multi-Select
 *    <Select
 *      options={skillOptions}
 *      multiple
 *      onChange={(values) => setValues(values)}
 *    />
 *
 * 3. With Label & Status
 *    <Select
 *      label="Priority"
 *      options={priorityOptions}
 *      error
 *      errorMessage="Priority required"
 *    />
 *
 * 4. Searchable
 *    <Select
 *      options={options}
 *      searchable
 *      searchPlaceholder="Search..."
 *    />
 *
 * 5. Custom Rendering
 *    <Select
 *      options={options}
 *      renderOption={(option, isSelected) => (
 *        <div>{option.label} {isSelected && '✓'}</div>
 *      )}
 *    />
 *
 * 6. Custom Value Display
 *    <Select
 *      options={options}
 *      multiple
 *      renderValue={(selected) => (
 *        <span>{selected.length} items selected</span>
 *      )}
 *    />
 */
