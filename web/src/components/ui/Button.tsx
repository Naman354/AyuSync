import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "tan";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    let baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
    
    let variantStyles = "";
    if (variant === "default") variantStyles = "bg-ayugreen text-white shadow-sm hover:bg-ayugreen-dark";
    else if (variant === "tan") variantStyles = "bg-ayutan text-ayudark shadow-sm hover:bg-ayutan-dark font-medium";
    else if (variant === "destructive") variantStyles = "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90";
    else if (variant === "outline") variantStyles = "border border-border bg-white shadow-sm hover:bg-ayugreen-light hover:text-ayugreen-dark hover:border-ayugreen/30";
    else if (variant === "secondary") variantStyles = "bg-ayugreen-light text-ayugreen-dark shadow-sm hover:bg-ayugreen-light/80";
    else if (variant === "ghost") variantStyles = "hover:bg-ayugreen-light hover:text-ayugreen-dark";
    else if (variant === "link") variantStyles = "text-ayugreen underline-offset-4 hover:underline";

    let sizeStyles = "";
    if (size === "default") sizeStyles = "h-9 px-4 py-2";
    else if (size === "sm") sizeStyles = "h-8 rounded-md px-3 text-xs";
    else if (size === "lg") sizeStyles = "h-10 rounded-md px-8";
    else if (size === "icon") sizeStyles = "h-9 w-9";

    const combinedClassName = `${baseStyles} ${variantStyles} ${sizeStyles} ${className || ""}`;

    return (
      <button
        className={combinedClassName}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
