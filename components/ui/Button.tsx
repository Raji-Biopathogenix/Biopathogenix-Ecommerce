import * as React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "premium-button-primary px-6 py-3 text-[0.95rem]",
  secondary: "premium-button-secondary px-6 py-3 text-[0.95rem]",
  ghost: "px-4 py-2 text-[#10264a] hover:bg-[#eef5fc]",
};

export default function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`${variantClasses[variant]} ${className}`.trim()}
    />
  );
}
