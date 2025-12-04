'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

/**
 * Page transition wrapper component
 * Adds smooth fade and slide animations when pages mount/unmount
 * Framer Motion automatically respects prefers-reduced-motion
 */
export default function PageTransition({ children, className }: PageTransitionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * Stagger container for list animations
 */
export function StaggerContainer({ children, className }: PageTransitionProps) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.05,
                    },
                },
                hidden: {
                    opacity: 0,
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * Item animation for use in stagger containers
 */
export function StaggerItem({ children, className }: PageTransitionProps) {
    return (
        <motion.div
            variants={{
                visible: {
                    opacity: 1,
                    y: 0,
                },
                hidden: {
                    opacity: 0,
                    y: 10,
                },
            }}
            transition={{ duration: 0.3 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * Fade in animation
 */
export function FadeIn({ children, delay = 0, className }: PageTransitionProps & { delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * Scale on tap animation (for buttons)
 */
export function ScaleOnTap({ children, className }: PageTransitionProps) {
    return (
        <motion.div whileTap={{ scale: 0.95 }} className={className}>
            {children}
        </motion.div>
    );
}
