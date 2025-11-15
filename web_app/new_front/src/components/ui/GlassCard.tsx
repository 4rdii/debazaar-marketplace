import React from 'react';
import { motion } from 'motion/react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className = '', hover = false, onClick }: GlassCardProps) {
  const cardClass = `glass-card rounded-3xl ${className}`;

  if (hover) {
    return (
      <motion.div
        className={cardClass}
        onClick={onClick}
        whileHover={{ 
          y: -8, 
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)' 
        }}
        transition={{ duration: 0.2 }}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cardClass} onClick={onClick}>
      {children}
    </div>
  );
}
