import {
  BookOpen,
  Briefcase,
  Brush,
  Gamepad2,
  HeartPulse,
  Shapes,
  type LucideIcon,
} from 'lucide-react';
import type { Category } from '@/lib/api/types';

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  STUDY: BookOpen,
  WORK: Briefcase,
  HEALTH: HeartPulse,
  CHORES: Brush,
  GAMING: Gamepad2,
  OTHER: Shapes,
};
