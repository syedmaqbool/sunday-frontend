import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  CreditCard,
  Heart,
  HelpCircle,

  MessageCircle,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Truck,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  BookOpen,
  CreditCard,
  Heart,
  HelpCircle,
  MessageCircle,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Truck,
};

export const HELP_ICON_OPTIONS = Object.keys(MAP);

export function getHelpIcon(name: string | null | undefined): LucideIcon {
  return (name && MAP[name]) || BookOpen;
}
