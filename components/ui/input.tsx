// components/ui/input.tsx
import React, { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input = ({ className, ...props }: InputProps) => {
  return (
    <input
      {...props}
      className={`border-gray-300 border-2 rounded-md p-2 w-full ${className} text-slate-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent`}
    />
  );
};
