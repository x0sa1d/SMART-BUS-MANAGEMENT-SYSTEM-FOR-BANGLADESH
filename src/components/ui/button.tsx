import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "ios-btn inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-[10px] text-sm font-semibold tracking-[-0.01em]",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "cursor-pointer select-none active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_10px_24px_-10px_rgba(23,77,58,0.4)] hover:brightness-110 hover:shadow-[0_14px_28px_-12px_rgba(23,77,58,0.5)] border border-white/10",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_10px_24px_-10px_rgba(217,75,69,0.4)] hover:brightness-110 border border-white/10",
        outline:
          "border border-border bg-white text-ink shadow-[0_8px_20px_-14px_rgba(23,77,58,0.16)] hover:bg-white hover:border-bd-green/35 dark:bg-card/55 dark:hover:bg-card/80",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_10px_24px_-12px_rgba(23,77,58,0.4)] hover:brightness-110 border border-white/10",
        ghost:
          "bg-transparent text-foreground hover:bg-bd-green/10 hover:text-bd-green",
        link: "text-primary underline-offset-4 hover:underline rounded-md px-0 shadow-none border-0",
        gradient:
          "gradient-primary text-white shadow-[0_12px_28px_-12px_rgba(23,77,58,0.45)] hover:brightness-110 border border-white/10",
        ticket:
          "gradient-ticket text-white shadow-[0_12px_28px_-12px_rgba(242,140,40,0.45)] hover:brightness-110 border border-white/10",
      },
      size: {
        default: "h-12 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-[15px]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
