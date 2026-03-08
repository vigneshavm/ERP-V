import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`rounded-xl border border-default bg-card shadow-sm transition-all ${className}`}>
    {children}
  </div>
);
