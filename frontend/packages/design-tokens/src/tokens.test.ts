import { describe, it, expect } from 'vitest';
import { tokens } from './tokens';

describe('Design Tokens', () => {
  it('should have brand colors', () => {
    expect(tokens.color.brand[500]).toBeDefined();
    expect(tokens.color.brand[500]).toBe('#3B82F6');
  });

  it('should have spacing values', () => {
    expect(tokens.spacing.md).toBe('16px');
  });

  it('should have border radius values', () => {
    expect(tokens.radius.card).toBe('12px');
  });

  it('should have animation definitions', () => {
    expect(tokens.animations['fade-in']).toBeDefined();
  });
});
