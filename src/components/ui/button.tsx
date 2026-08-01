import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        /* ─── Atlas chrome variants ─── */
        atlas: 'border border-atlas-line bg-atlas-accent text-atlas-accent-fg shadow-atlas-glow hover:bg-atlas-accent-hover',
        'atlas-surface': 'border border-atlas-line bg-atlas-elevated text-atlas-ink-2 shadow-atlas-card hover:bg-atlas-elevated-hover',
        'atlas-glass': 'border border-atlas-line bg-atlas-elevated/95 text-atlas-ink shadow-atlas-card hover:bg-atlas-elevated',
        'atlas-row': 'w-full justify-start gap-2 rounded-md text-left font-normal text-atlas-ink-2 hover:bg-atlas-hover',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
        /* ─── Atlas chrome sizes ─── */
        atlas: 'h-[26px] rounded-md px-[11px] text-[12.5px] font-medium',
        'atlas-pill': 'rounded-[7px] px-2.5 py-[5px] text-xs font-medium',
        'atlas-row': 'rounded-md px-2 py-1.5 text-[13px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
