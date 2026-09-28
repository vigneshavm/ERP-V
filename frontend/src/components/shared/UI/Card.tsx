import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'flat' | 'outlined';
export type CardSize = 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: CardVariant;
  /** Card padding size */
  size?: CardSize;
  /** Interactive hover effect */
  interactive?: boolean;
  /** Full height */
  fullHeight?: boolean;
  /** Background overlay color on hover (for interactive cards) */
  hoverOverlay?: boolean;
  /** Padding className override */
  paddingClassName?: string;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional trailing element (icon, badge, etc.) */
  trailing?: React.ReactNode;
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Auto wrap body content in scrollable container if height exceeds screen */
  scrollable?: boolean;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Layout direction for footer content */
  layout?: 'row' | 'column';
  /** Justify content alignment */
  justify?: 'start' | 'end' | 'center' | 'between';
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white dark:bg-slate-900 border border-default dark:border-slate-700 shadow-sm hover:shadow-md',
  elevated: 'bg-white dark:bg-slate-900 border border-default dark:border-slate-700 shadow-lg dark:shadow-2xl hover:shadow-xl',
  flat: 'bg-slate-50 dark:bg-slate-800 border-0',
  outlined: 'bg-transparent border-2 border-default dark:border-slate-600',
};

const sizeClasses: Record<CardSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8 lg:p-10',
};

/**
 * Reusable Card component for grouping content.
 *
 * @example
 * // Basic card
 * <Card>
 *   <Card.Header>Title</Card.Header>
 *   <Card.Body>Content</Card.Body>
 * </Card>
 *
 * // Interactive card
 * <Card variant="elevated" interactive onClick={handleClick}>
 *   <Card.Header>Clickable Card</Card.Header>
 *   <Card.Body>Click me for action</Card.Body>
 * </Card>
 *
 * // Full card with footer
 * <Card>
 *   <Card.Header trailing={<Badge>NEW</Badge>}>Title</Card.Header>
 *   <Card.Body>Content goes here</Card.Body>
 *   <Card.Footer justify="end">
 *     <Button variant="secondary">Cancel</Button>
 *     <Button variant="primary">Confirm</Button>
 *   </Card.Footer>
 * </Card>
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      size = 'md',
      interactive = false,
      fullHeight = false,
      hoverOverlay = false,
      className = '',
      paddingClassName,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyle = variantClasses[variant];
    const sizeStyle = paddingClassName || sizeClasses[size];
    const interactiveClasses = interactive ? 'cursor-pointer transition-all duration-200 hover:scale-[1.02]' : '';
    const overlayClasses = interactive && hoverOverlay ? 'hover:bg-black/2 dark:hover:bg-white/2' : '';
    const heightClass = fullHeight ? 'h-full' : '';

    return (
      <div
        ref={ref}
        className={`
          rounded-lg
          ${variantStyle}
          ${sizeStyle}
          ${interactiveClasses}
          ${overlayClasses}
          ${heightClass}
          ${className}
        `.replace(/\s+/g, ' ').trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card.Header - Semantic header section for Card
 */
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ trailing, className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`
        flex items-center justify-between
        pb-4
        border-b border-slate-100 dark:border-slate-700
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      {...props}
    >
      <div className="flex-1">{children}</div>
      {trailing && <div className="flex items-center ml-4">{trailing}</div>}
    </div>
  )
);

CardHeader.displayName = 'Card.Header';

/**
 * Card.Body - Main content section for Card
 */
const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ scrollable = false, className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`
        pt-4
        ${scrollable ? 'overflow-y-auto max-h-[calc(100vh-300px)]' : ''}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      {...props}
    >
      {children}
    </div>
  )
);

CardBody.displayName = 'Card.Body';

/**
 * Card.Footer - Footer section for Card (typically actions)
 */
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ layout = 'row', justify = 'between', className = '', children, ...props }, ref) => {
    const justifyMap = {
      start: 'justify-start',
      end: 'justify-end',
      center: 'justify-center',
      between: 'justify-between',
    };

    const layoutClass = layout === 'row' ? 'flex flex-row gap-3' : 'flex flex-col gap-2';

    return (
      <div
        ref={ref}
        className={`
          mt-6
          pt-4
          border-t border-slate-100 dark:border-slate-700
          ${layoutClass}
          ${justifyMap[justify]}
          ${className}
        `.replace(/\s+/g, ' ').trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'Card.Footer';

// Attach subcomponents to Card
const CardComponent = Object.assign(Card, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});

export default CardComponent;
