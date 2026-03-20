"use client";

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    padding?: 'none' | 'small' | 'medium' | 'large';
    noMargin?: boolean;
    interactive?: boolean;
}

const paddingMap = {
    none: '0',
    small: '12px',
    medium: '16px',
    large: '20px'
};

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'medium',
    noMargin = false,
    interactive = false,
    style,
    ...props
}) => {
    return (
        <motion.div
            className={`glass-card ${interactive ? 'clickable' : ''} ${className}`}
            whileHover={interactive ? { scale: 1.02 } : undefined}
            whileTap={interactive ? { scale: 0.98 } : undefined}
            style={{
                padding: paddingMap[padding],
                marginBottom: noMargin ? '0' : '16px',
                ...style
            }}
            {...props}
        >
            {children}
        </motion.div>
    );
};
