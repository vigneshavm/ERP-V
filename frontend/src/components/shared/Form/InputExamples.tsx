/**
 * Input Component Usage Examples
 * 
 * This file demonstrates all available Input variants, sizes, and states.
 * Import Input from '@/components/shared'
 */

import React, { useState } from 'react';
import { Input } from '@/components/shared';
import { 
  Mail, 
  Lock, 
  User, 
  Search, 
  Phone, 
  MapPin,
  DollarSign
} from 'lucide-react';

export const InputExamples: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    phone: '',
  });

  const [validation, setValidation] = useState({
    email: false,
    password: false,
    username: false,
  });

  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    // Simple email validation
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setValidation({ ...validation, email: isValid });
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    // Simple password validation (at least 8 chars)
    setValidation({ ...validation, password: value.length >= 8 });
  };

  const handleUsernameChange = (value: string) => {
    setFormData({ ...formData, username: value });
    // Simple username validation (alphanumeric, 3+ chars)
    const isValid = /^[a-zA-Z0-9_]{3,}$/.test(value);
    setValidation({ ...validation, username: isValid });
  };

  return (
    <div className="space-y-12 p-8 bg-slate-50 dark:bg-slate-900">
      {/* ============================================ */}
      {/* BASIC INPUTS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Basic Inputs</h2>
        
        <div className="max-w-md space-y-4">
          <Input 
            label="Text Input" 
            placeholder="Enter text..." 
          />

          <Input 
            label="Email" 
            type="email" 
            placeholder="user@example.com" 
          />

          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
          />

          <Input 
            label="Number" 
            type="number" 
            placeholder="Enter number..." 
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* SIZES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Input Sizes</h2>
        
        <div className="max-w-md space-y-4">
          <Input 
            label="Small" 
            size="sm"
            placeholder="Small input..." 
          />

          <Input 
            label="Medium (default)" 
            size="md"
            placeholder="Medium input..." 
          />

          <Input 
            label="Large" 
            size="lg"
            placeholder="Large input..." 
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* WITH ICONS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">With Icons</h2>
        
        <div className="max-w-md space-y-4">
          <Input 
            label="Email Address" 
            type="email" 
            icon={<Mail size={16} />}
            placeholder="user@example.com" 
          />

          <Input 
            label="Username" 
            icon={<User size={16} />}
            placeholder="johndoe" 
          />

          <Input 
            label="Phone Number" 
            type="tel" 
            icon={<Phone size={16} />}
            placeholder="+1 (555) 123-4567" 
          />

          <Input 
            label="Search Location" 
            type="search" 
            icon={<MapPin size={16} />}
            placeholder="Search..." 
          />

          <Input 
            label="Price" 
            type="number" 
            icon={<DollarSign size={16} />}
            placeholder="0.00" 
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* VALIDATION STATES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Validation States</h2>
        
        <div className="max-w-md space-y-4">
          {/* Success State */}
          <Input 
            label="Username (Available)" 
            value={formData.username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            success={formData.username.length > 0 && validation.username}
            error={formData.username.length > 0 && !validation.username ? 'Username must be 3+ alphanumeric chars' : undefined}
            helperText={validation.username ? 'Username is available' : undefined}
            placeholder="Enter username..." 
          />

          {/* Error State */}
          <Input 
            label="Email" 
            type="email"
            value={formData.email}
            onChange={(e) => handleEmailChange(e.target.value)}
            error={formData.email.length > 0 && !validation.email ? 'Please enter a valid email' : undefined}
            success={validation.email}
            placeholder="user@example.com" 
          />

          {/* Warning State */}
          <Input 
            label="Password Strength" 
            type="password"
            value={formData.password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            warning={formData.password.length > 0 && formData.password.length < 8 ? 'Password should be at least 8 characters' : undefined}
            success={validation.password}
            placeholder="••••••••" 
            showPasswordToggle
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* PASSWORD TOGGLE */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Password Toggle</h2>
        
        <div className="max-w-md space-y-4">
          <Input 
            label="Password with Toggle" 
            type="password" 
            icon={<Lock size={16} />}
            showPasswordToggle
            placeholder="••••••••" 
          />

          <Input 
            label="Confirm Password" 
            type="password" 
            showPasswordToggle={false}
            placeholder="••••••••" 
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* DISABLED STATE */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Disabled State</h2>
        
        <div className="max-w-md space-y-4">
          <Input 
            label="Disabled Input" 
            disabled
            placeholder="This is disabled..." 
          />

          <Input 
            label="Read-only Field" 
            value="System Generated ID"
            disabled
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* REQUIRED FIELDS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Required Fields</h2>
        
        <div className="max-w-md space-y-4">
          <Input 
            label="Full Name" 
            required
            placeholder="John Doe" 
          />

          <Input 
            label="Email Address" 
            type="email"
            required
            placeholder="user@example.com" 
          />

          <Input 
            label="Password" 
            type="password"
            required
            placeholder="••••••••" 
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* HELPER TEXT */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Helper Text</h2>
        
        <div className="max-w-md space-y-4">
          <Input 
            label="Username" 
            helperText="3-20 characters. Letters, numbers, and underscores only."
            placeholder="johndoe" 
          />

          <Input 
            label="Email Address" 
            type="email"
            helperText="We'll never share your email with anyone else."
            placeholder="user@example.com" 
          />

          <Input 
            label="Password" 
            type="password"
            helperText="Must contain uppercase, lowercase, number, and special character."
            placeholder="••••••••" 
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* COMMON PATTERNS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Common Patterns</h2>
        
        {/* Login Form */}
        <div className="mb-8 max-w-md">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Login Form</h3>
          <div className="space-y-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Input 
              label="Email" 
              type="email" 
              icon={<Mail size={16} />}
              placeholder="user@example.com" 
              required
            />

            <Input 
              label="Password" 
              type="password" 
              icon={<Lock size={16} />}
              placeholder="••••••••" 
              required
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-md">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Search Input</h3>
          <Input 
            type="search" 
            icon={<Search size={16} />}
            placeholder="Search customers, orders, items..." 
            size="md"
          />
        </div>

        {/* Registration Form (Partial) */}
        <div className="max-w-md">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Registration Form Fields</h3>
          <div className="space-y-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Input 
              label="Full Name" 
              icon={<User size={16} />}
              placeholder="John Doe" 
              required
            />

            <Input 
              label="Email" 
              type="email" 
              icon={<Mail size={16} />}
              placeholder="user@example.com" 
              required
            />

            <Input 
              label="Phone" 
              type="tel" 
              icon={<Phone size={16} />}
              placeholder="+1 (555) 123-4567" 
            />

            <Input 
              label="Password" 
              type="password" 
              icon={<Lock size={16} />}
              placeholder="••••••••" 
              required
              showPasswordToggle
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default InputExamples;

/**
 * USAGE GUIDE
 * 
 * 1. Basic Input
 *    <Input label="Username" placeholder="johndoe" />
 * 
 * 2. With Type
 *    <Input label="Email" type="email" placeholder="user@example.com" />
 * 
 * 3. With Size
 *    <Input size="lg" placeholder="Large input" />
 * 
 * 4. With Icon
 *    <Input icon={<Mail size={16} />} placeholder="Email..." />
 * 
 * 5. With Error
 *    <Input error="Email is required" placeholder="user@example.com" />
 * 
 * 6. With Success
 *    <Input success={true} helperText="All good!" />
 * 
 * 7. With Warning
 *    <Input warning="Password is weak" type="password" />
 * 
 * 8. With Helper Text
 *    <Input helperText="3-20 characters only" placeholder="..." />
 * 
 * 9. Required Field
 *    <Input label="Email" type="email" required />
 * 
 * 10. Password Toggle
 *     <Input type="password" showPasswordToggle placeholder="••••••••" />
 * 
 * 11. Disabled
 *     <Input disabled value="Read-only" />
 * 
 * 12. Full Example
 *     <Input
 *       label="Email Address"
 *       type="email"
 *       icon={<Mail size={16} />}
 *       error={errors.email}
 *       helperText="We'll never share your email"
 *       required
 *       placeholder="user@example.com"
 *       onChange={(e) => handleChange(e)}
 *     />
 */
