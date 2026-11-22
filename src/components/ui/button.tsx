import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium cursor-pointer transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_10px_30px_-14px_oklch(0.77_0.13_88/70%)] hover:brightness-110 hover:shadow-[0_0_36px_-8px_oklch(0.77_0.13_88/60%)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:brightness-110 hover:shadow-[0_0_32px_-10px_oklch(0.65_0.22_16/70%)]",
        outline:
          "border border-white/12 bg-white/[0.04] backdrop-blur-md shadow-[inset_0_1px_0_0_oklch(1_0_0/8%)] hover:border-white/20 hover:bg-white/[0.08] hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-white/[0.07] hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gold: "sheen bg-gold-gradient text-gold-foreground font-semibold shadow-gold hover:brightness-110 hover:shadow-[0_0_44px_-8px_oklch(0.8_0.13_90/70%)] hover:-translate-y-px",
        terminal:
          "border border-white/12 bg-white/[0.05] backdrop-blur-md text-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/8%)] hover:border-gold/50 hover:bg-gold/[0.08] hover:text-gold hover:shadow-[0_0_34px_-12px_oklch(0.8_0.13_90/60%)]",
      },
      size: {
        default: "h-9 px-5 py-2",
        sm: "h-8 rounded-full px-3.5 text-xs",
        lg: "h-11 rounded-full px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
