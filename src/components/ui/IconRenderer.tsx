import React from 'react';
import * as Icons from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-5 h-5', size, color }) => {
  // Normalize lucide icon key (e.g., Code2, BookOpen)
  const iconKey = (name.charAt(0).toUpperCase() + name.slice(1)) as keyof typeof Icons;
  const LucideIcon = (Icons[iconKey] as React.ComponentType<{ className?: string; size?: number; color?: string }>) || Icons.CheckSquare;

  return <LucideIcon className={className} size={size} color={color} />;
};
