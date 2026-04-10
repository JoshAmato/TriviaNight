import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "correct";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-bg hover:bg-accent-dim",
  secondary: "bg-surface-hi text-text border border-surface-border hover:border-text-dim",
  danger: "bg-danger text-white hover:bg-danger-dim",
  ghost: "bg-transparent text-text-mid hover:bg-surface-hi hover:text-text",
  correct: "bg-correct text-bg hover:bg-correct-dim",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-xs rounded-md",
  md: "px-5 py-2.5 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center font-bold tracking-wide transition-all duration-150 ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? "cursor-default opacity-50" : "cursor-pointer"} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
