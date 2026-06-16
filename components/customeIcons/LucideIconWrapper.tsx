// LucideIconWrapper.tsx
import React from 'react';

export interface LucideProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
  className?: string;
}

export type LucideIcon = React.ForwardRefExoticComponent<
  LucideProps & React.RefAttributes<SVGSVGElement>
>;

/**
 * Creates a Lucide-style icon component with TypeScript support
 */

export const createLucideIcon = (
  displayName: string,
  children: React.ReactNode
): LucideIcon => {
  const IconComponent = React.forwardRef<SVGSVGElement, LucideProps>(
    (
      {
        size = 24,
        color = 'currentColor',
        strokeWidth = 2,
        absoluteStrokeWidth = false,
        className = '',
        ...props
      },
      ref
    ) => {
      const finalStrokeWidth = absoluteStrokeWidth
        ? (Number(strokeWidth) * 24) / Number(size)
        : strokeWidth;

      return (
        <svg
          ref={ref}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={finalStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`lucide lucide-${displayName.toLowerCase()} ${className}`}
          {...props}
        >
          {children}
        </svg>
      );
    }
  );

  IconComponent.displayName = displayName;
  return IconComponent;
};