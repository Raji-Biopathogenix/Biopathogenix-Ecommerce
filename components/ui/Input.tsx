import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-[#dbe7f3] bg-white px-4 py-3 text-[15px] text-[#10264a] outline-none transition placeholder:text-[#8aa0ba] focus:border-[#4f87cb] focus:ring-4 focus:ring-[rgba(79,135,203,0.12)] ${className}`.trim()}
    />
  );
}
