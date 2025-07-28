// components/ui/button.tsx
import React, { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  [key: string]: unknown; // Allow additional props
}

export const Button = ({
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={`bg-slate-100 text-gray-800 font-bold py-2 px-4 rounded-md ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
