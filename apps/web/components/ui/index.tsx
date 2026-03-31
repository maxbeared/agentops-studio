'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// ============================================
// Hooks
// ============================================

export function useInView(options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// ============================================
// RevealSection - Scroll fade-in animation
// ============================================

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function RevealSection({ children, className = '', delay = 0 }: RevealSectionProps) {
  const { ref, isVisible } = useInView();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 h-full ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ============================================
// PageHeader - Consistent page headers
// ============================================

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  gradient?: boolean;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, action, gradient = false, children }: PageHeaderProps) {
  return (
    <header
      className={`
        rounded-2xl border border-zinc-800/50 p-6
        ${gradient ? 'bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-900/90' : 'bg-zinc-900/50'}
      `}
      style={{
        boxShadow: gradient ? '0 0 40px rgba(0,229,255,0.05), inset 0 1px 0 rgba(255,255,255,0.03)' : 'none',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold tracking-tight"
            style={{
              color: gradient ? '#00e5ff' : '#fafafa',
              textShadow: gradient ? '0 0 30px rgba(0,229,255,0.3)' : 'none',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-zinc-400 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}

// ============================================
// Card - Consistent card styling
// ============================================

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  glowColor?: string;
}

export function Card({ children, className = '', hover = false, glow = false, glowColor = '#00e5ff' }: CardProps) {
  return (
    <div
      className={`
        rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5
        ${hover ? 'transition-all hover:border-zinc-700 hover:bg-zinc-900/70' : ''}
        ${className}
      `}
      style={{
        boxShadow: glow ? `0 0 30px ${glowColor}15, inset 0 0 20px ${glowColor}05` : 'none',
      }}
    >
      {children}
    </div>
  );
}

// ============================================
// Button - Consistent button styling
// ============================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

type VariantStyle = {
  background: string;
  color: string;
  boxShadow: string;
  hover: string;
  border?: string;
};

const variantStyles: Record<string, VariantStyle> = {
  primary: {
    background: 'linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%)',
    color: '#0a0a0a',
    boxShadow: '0 0 20px rgba(0,229,255,0.25)',
    hover: 'hover:shadow-lg hover:scale-[1.02]',
  },
  secondary: {
    background: 'rgba(255,255,255,0.05)',
    color: '#e4e4e7',
    boxShadow: 'none',
    hover: 'hover:bg-zinc-800 hover:border-zinc-600',
    border: 'border border-zinc-700',
  },
  danger: {
    background: 'rgba(239,68,68,0.15)',
    color: '#f87171',
    boxShadow: 'none',
    hover: 'hover:bg-red-500/20',
    border: 'border border-red-500/30',
  },
  ghost: {
    background: 'transparent',
    color: '#a1a1aa',
    boxShadow: 'none',
    hover: 'hover:bg-zinc-800 hover:text-zinc-100',
  },
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const style = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center rounded-lg font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${style.border || ''}
        ${sizeStyle}
        ${className}
      `}
      style={{
        background: style.background,
        color: style.color,
        boxShadow: style.boxShadow,
      }}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}

// ============================================
// StatusBadge - Consistent status badges
// ============================================

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const statusVariants = {
  default: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const variantClass = statusVariants[variant];

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${variantClass}`}>
      {status}
    </span>
  );
}

// ============================================
// LoadingState - Consistent loading state
// ============================================

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      <span className="ml-3 text-zinc-400">{message}</span>
    </div>
  );
}

// ============================================
// EmptyState - Consistent empty state
// ============================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="rounded-full bg-zinc-800/50 p-4 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-zinc-300">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-zinc-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================
// Color palette for consistent theming
// ============================================

export const ACCENT_COLORS = {
  cyan: '#00e5ff',
  pink: '#ff4081',
  green: '#69f0ae',
  amber: '#ffca28',
  purple: '#ea80fc',
  blue: '#40c4ff',
};

export const CARD_COLORS = [
  { hex: '#00e5ff', glow: 'shadow-[0_0_30px_rgba(0,229,255,0.3)]', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  { hex: '#ff4081', glow: 'shadow-[0_0_30px_rgba(255,64,129,0.3)]', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  { hex: '#69f0ae', glow: 'shadow-[0_0_30px_rgba(105,240,174,0.3)]', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  { hex: '#ffca28', glow: 'shadow-[0_0_30px_rgba(255,202,40,0.3)]', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { hex: '#ea80fc', glow: 'shadow-[0_0_30px_rgba(234,128,252,0.3)]', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { hex: '#40c4ff', glow: 'shadow-[0_0_30px_rgba(64,196,255,0.3)]', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
];