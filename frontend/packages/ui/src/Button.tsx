import React from "react";

export const Button = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <button className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}>
    {children}
  </button>
);
