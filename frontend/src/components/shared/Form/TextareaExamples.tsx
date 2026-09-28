/**
 * Textarea Component Usage Examples
 * 
 * This file demonstrates all available Textarea variants, sizes, and patterns.
 * Import Textarea from '@/components/shared'
 */

import React, { useState } from 'react';
import { Textarea, Button, Card } from '@/components/shared';
import { MessageCircle, AlertCircle } from 'lucide-react';

export const TextareaExamples: React.FC = () => {
  const [feedbackText, setFeedbackText] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [storyText, setStoryText] = useState('');

  return (
    <div className="space-y-12 p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* ============================================ */}
      {/* SIZES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Textarea Sizes</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="default">
            <Card.Header>Small</Card.Header>
            <Card.Body>
              <Textarea
                size="sm"
                placeholder="Small textarea (12px text)"
                minRows={3}
              />
            </Card.Body>
          </Card>

          <Card variant="default">
            <Card.Header>Medium</Card.Header>
            <Card.Body>
              <Textarea
                size="md"
                placeholder="Medium textarea (14px text, default)"
                minRows={3}
              />
            </Card.Body>
          </Card>

          <Card variant="default">
            <Card.Header>Large</Card.Header>
            <Card.Body>
              <Textarea
                size="lg"
                placeholder="Large textarea (16px text)"
                minRows={3}
              />
            </Card.Body>
          </Card>
        </div>
      </section>

      {/* ============================================ */}
      {/* STATUS STATES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Status States</h2>

        <div className="space-y-6">
          {/* Default */}
          <Textarea
            size="md"
            label="Default"
            placeholder="Standard textarea with no status"
            helperText="This is default state"
            minRows={3}
          />

          {/* Success */}
          <Textarea
            size="md"
            label="Success"
            placeholder="Your input is valid"
            success
            helperText="Input validated successfully"
            minRows={3}
            defaultValue="Valid feedback provided"
          />

          {/* Error */}
          <Textarea
            size="md"
            label="Error"
            placeholder="Something went wrong"
            error
            errorMessage="Description is required and must be at least 10 characters"
            helperText="Please correct the error below"
            minRows={3}
          />

          {/* Warning */}
          <Textarea
            size="md"
            label="Warning"
            placeholder="This needs attention"
            warning
            warningMessage="Character limit approaching (80/100)"
            helperText="Keep description concise"
            minRows={3}
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* CHARACTER COUNTER */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Character Counter
        </h2>

        <div className="max-w-2xl">
          <Textarea
            size="md"
            label="Product Description"
            placeholder="Write a product description (max 200 characters)"
            helperText="Make it compelling and informative"
            maxLength={200}
            showCharCounter
            minRows={4}
            value={descriptionText}
            onChange={(e) => setDescriptionText(e.target.value)}
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* AUTO RESIZE */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Auto-Resize Height
        </h2>

        <Card variant="elevated" size="lg">
          <Card.Header>Textarea Auto-Resize</Card.Header>

          <Card.Body>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              This textarea automatically grows as you type more content.
            </p>

            <Textarea
              size="md"
              placeholder="Start typing... the textarea will grow automatically"
              helperText="No manual resize needed"
              autoResize
              minRows={3}
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
            />
          </Card.Body>
        </Card>
      </section>

      {/* ============================================ */}
      {/* WITH ICONS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          With Icons
        </h2>

        <div className="space-y-6">
          {/* Left icon */}
          <Textarea
            size="md"
            label="Feedback with Icon"
            placeholder="Tell us what you think..."
            leftIcon={<MessageCircle size={16} />}
            helperText="Your feedback helps us improve"
            minRows={4}
          />

          {/* Right icon with error state */}
          <Textarea
            size="md"
            label="Error with Alert Icon"
            placeholder="Describe the issue..."
            error
            errorMessage="Please provide more details"
            rightIcon={<AlertCircle size={16} className="text-error" />}
            helperText="Include steps to reproduce"
            minRows={4}
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* DISABLED STATE */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Disabled State
        </h2>

        <div className="space-y-6">
          <Textarea
            size="md"
            label="Locked Textarea"
            placeholder="This textarea is disabled"
            disabled
            value="This content is read-only. You cannot edit it."
            minRows={4}
            helperText="Disabled textareas cannot be edited"
          />

          <Textarea
            size="md"
            label="Disabled with Status"
            placeholder="This is disabled"
            disabled
            success
            value="Successfully saved"
            minRows={3}
            helperText="Previous input is saved"
          />
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
              Report an Issue
            </h3>
          </Card.Header>

          <Card.Body>
            <div className="space-y-4">
              <Textarea
                size="md"
                label="Issue Title"
                placeholder="Brief description of the issue"
                required
                maxLength={100}
                showCharCounter
                helperText="Keep the title short and descriptive"
                minRows={2}
              />

              <Textarea
                size="md"
                label="Detailed Description"
                placeholder="Describe what happened, what you expected, and any error messages"
                required
                maxLength={1000}
                showCharCounter
                helperText="The more details, the better we can help"
                minRows={5}
              />

              <Textarea
                size="md"
                label="Steps to Reproduce"
                placeholder="1. Step one&#10;2. Step two&#10;3. Step three"
                helperText="Optional: Help us reproduce the issue"
                minRows={4}
              />
            </div>
          </Card.Body>

          <Card.Footer justify="end">
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary">Submit Report</Button>
          </Card.Footer>
        </Card>
      </section>

      {/* ============================================ */}
      {/* FEEDBACK FORM */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Feedback Form
        </h2>

        <Card variant="default" size="lg" className="max-w-2xl">
          <Card.Header>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Share Your Feedback
            </h3>
          </Card.Header>

          <Card.Body>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Help us improve by sharing your thoughts, suggestions, or bug reports.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-900 dark:text-white block mb-2">
                  Feedback Type
                </label>
                <div className="flex gap-4">
                  {['Bug', 'Feature', 'Improvement', 'Other'].map((type) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="feedbackType"
                        value={type}
                        defaultChecked={type === 'Bug'}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Textarea
                size="md"
                label="Your Feedback"
                placeholder="Tell us what's on your mind..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                maxLength={500}
                showCharCounter
                autoResize
                minRows={5}
                helperText="Be as specific as possible"
              />

              <Textarea
                size="md"
                label="Email (optional)"
                placeholder="We'll follow up if you'd like"
                helperText="Only if you want us to contact you"
                minRows={1}
              />
            </div>
          </Card.Body>

          <Card.Footer justify="end">
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary" disabled={!feedbackText.trim()}>
              Send Feedback
            </Button>
          </Card.Footer>
        </Card>
      </section>

      {/* ============================================ */}
      {/* COMMON PATTERNS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Common Patterns
        </h2>

        <div className="space-y-6">
          {/* Notes/Comments */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
              Notes / Comments
            </h3>
            <Textarea
              size="md"
              label="Add Note"
              placeholder="Add a note or comment..."
              leftIcon={<MessageCircle size={16} />}
              minRows={3}
            />
          </div>

          {/* Bio/About */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
              Bio / Profile Description
            </h3>
            <Textarea
              size="md"
              label="About Me"
              placeholder="Tell us about yourself..."
              maxLength={250}
              showCharCounter
              minRows={4}
              helperText="Used on your public profile"
            />
          </div>

          {/* Long-form content */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
              Blog Post / Article
            </h3>
            <Textarea
              size="md"
              label="Article Content"
              placeholder="Write your article here..."
              autoResize
              minRows={10}
              helperText="Markdown formatting supported"
            />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* READONLY STATE */}
      {/* ============================================ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Read-Only State
        </h2>

        <Card variant="flat" size="lg" className="max-w-2xl">
          <Card.Header>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Contract Preview
            </h3>
          </Card.Header>

          <Card.Body>
            <Textarea
              size="md"
              label="Terms & Conditions"
              value={`Terms and Conditions

Last updated: September 27, 2026

1. Use License
Permission is granted to temporarily download one copy of the materials for personal, non-commercial transitory viewing only.

2. Disclaimer
The materials on this site are provided on an "as is" basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties...`}
              readOnly
              minRows={10}
              helperText="Read-only contract text"
            />
          </Card.Body>
        </Card>
      </section>
    </div>
  );
};

export default TextareaExamples;

/**
 * USAGE GUIDE
 *
 * 1. Basic Textarea
 *    <Textarea placeholder="Enter text..." />
 *
 * 2. With Size
 *    <Textarea size="lg" placeholder="..." />
 *
 * 3. With Label & Helper
 *    <Textarea
 *      label="Feedback"
 *      placeholder="..."
 *      helperText="Be descriptive"
 *      required
 *    />
 *
 * 4. With Status
 *    <Textarea error errorMessage="Required field" />
 *    <Textarea success />
 *    <Textarea warning warningMessage="Character limit approaching" />
 *
 * 5. With Character Counter
 *    <Textarea
 *      maxLength={200}
 *      showCharCounter
 *      placeholder="Max 200 characters"
 *    />
 *
 * 6. Auto-Resize
 *    <Textarea autoResize minRows={3} placeholder="Grows as you type" />
 *
 * 7. With Icons
 *    <Textarea leftIcon={<Icon />} placeholder="..." />
 *
 * 8. Disabled/Read-Only
 *    <Textarea disabled placeholder="..." />
 *    <Textarea readOnly value="Read only content" />
 *
 * 9. Form Integration
 *    <Textarea
 *      name="feedback"
 *      value={value}
 *      onChange={(e) => setValue(e.target.value)}
 *      required
 *      maxLength={500}
 *      showCharCounter
 *    />
 */
